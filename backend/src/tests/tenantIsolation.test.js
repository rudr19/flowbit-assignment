const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const app = require('../app');
const User = require('../models/User');
const Ticket = require('../models/Ticket');

const MONGODB_URI = process.env.TEST_DB_URL || 'mongodb://localhost:27017/flowbit_test';

describe('Tenant Isolation Tests', () => {
  let tenantAUser, tenantBUser;
  let tenantAToken, tenantBToken;
  let tenantATicket, tenantBTicket;

  beforeAll(async () => {
    await mongoose.connect(MONGODB_URI);
    await User.deleteMany({});
    await Ticket.deleteMany({});
  });

  beforeEach(async () => {
    const hashedPassword = await bcrypt.hash('testpassword', 10);

    tenantAUser = await User.create({
      email: 'admin@logisticsco.com',
      password: hashedPassword,
      customerId: 'LogisticsCo',
      role: 'Admin',
      firstName: 'Tenant A',
      lastName: 'Admin'
    });

    tenantBUser = await User.create({
      email: 'admin@retailgmbh.com',
      password: hashedPassword,
      customerId: 'RetailGmbH',
      role: 'Admin',
      firstName: 'Tenant B',
      lastName: 'Admin'
    });

    tenantAToken = jwt.sign({
      userId: tenantAUser._id,
      customerId: tenantAUser.customerId,
      role: tenantAUser.role,
      email: tenantAUser.email
    }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    tenantBToken = jwt.sign({
      userId: tenantBUser._id,
      customerId: tenantBUser.customerId,
      role: tenantBUser.role,
      email: tenantBUser.email
    }, process.env.JWT_SECRET || 'test-secret', { expiresIn: '1h' });

    tenantATicket = await Ticket.create({
      title: 'Tenant A Ticket',
      description: 'This ticket belongs to LogisticsCo',
      customerId: 'LogisticsCo',
      userId: tenantAUser._id,
      status: 'Open',
      priority: 'Medium'
    });

    tenantBTicket = await Ticket.create({
      title: 'Tenant B Ticket',
      description: 'This ticket belongs to RetailGmbH',
      customerId: 'RetailGmbH',
      userId: tenantBUser._id,
      status: 'Open',
      priority: 'High'
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
    await Ticket.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('Ticket Access Control', () => {
    test('Admin from Tenant A cannot read Tenant B tickets', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].customerId).toBe('LogisticsCo');
    });

    test('Admin from Tenant B cannot read Tenant A tickets', async () => {
      const response = await request(app)
        .get('/api/tickets')
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].customerId).toBe('RetailGmbH');
    });

    test('Tenant A cannot access specific Tenant B ticket by ID', async () => {
      const response = await request(app)
        .get(`/api/tickets/${tenantBTicket._id}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(404);
      expect(response.body.error).toBe('Ticket not found');
    });

    test('Tenant B cannot access specific Tenant A ticket by ID', async () => {
      const response = await request(app)
        .get(`/api/tickets/${tenantATicket._id}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .expect(404);
      expect(response.body.error).toBe('Ticket not found');
    });
  });

  describe('Ticket Creation Isolation', () => {
    test('Tenant A creates ticket with correct customerId', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({ title: 'A new one', description: 'Test', priority: 'High' })
        .expect(201);
      expect(res.body.customerId).toBe('LogisticsCo');
    });

    test('Tenant B creates ticket with correct customerId', async () => {
      const res = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ title: 'B new one', description: 'Test', priority: 'Low' })
        .expect(201);
      expect(res.body.customerId).toBe('RetailGmbH');
    });
  });

  describe('Ticket Update Isolation', () => {
    test('Tenant A cannot update Tenant B ticket', async () => {
      const res = await request(app)
        .put(`/api/tickets/${tenantBTicket._id}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .send({ title: 'hack', status: 'Closed' })
        .expect(404);
      expect(res.body.error).toBe('Ticket not found');
    });

    test('Tenant B cannot update Tenant A ticket', async () => {
      const res = await request(app)
        .put(`/api/tickets/${tenantATicket._id}`)
        .set('Authorization', `Bearer ${tenantBToken}`)
        .send({ title: 'hack', status: 'Closed' })
        .expect(404);
      expect(res.body.error).toBe('Ticket not found');
    });
  });

  describe('Ticket Deletion Isolation', () => {
    test('Tenant A cannot delete Tenant B ticket', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${tenantBTicket._id}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(404);
      expect(res.body.error).toBe('Ticket not found');

      const stillExists = await Ticket.findById(tenantBTicket._id);
      expect(stillExists).not.toBeNull();
    });

    test('Tenant A can delete its own ticket', async () => {
      const res = await request(app)
        .delete(`/api/tickets/${tenantATicket._id}`)
        .set('Authorization', `Bearer ${tenantAToken}`)
        .expect(200);
      expect(res.body.message).toBe('Ticket deleted successfully');

      const deleted = await Ticket.findById(tenantATicket._id);
      expect(deleted).toBeNull();
    });
  });
});
