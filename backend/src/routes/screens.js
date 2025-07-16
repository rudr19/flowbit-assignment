const express = require('express');
const fs = require('fs');
const path = require('path');
const { authenticateToken } = require('../middleware/auth'); 

const router = express.Router();
router.use(authenticateToken);
const loadRegistry = () => {
  try {
    const registryPath = path.join(__dirname, '../../../registry.json');
    const registryData = fs.readFileSync(registryPath, 'utf8');
    return JSON.parse(registryData);
  } catch (error) {
    console.error('Failed to load registry:', error);
    return {
      "LogisticsCo": {
        "screens": [
          {
            "name": "Support Tickets",
            "url": "/support",
            "icon": "ticket",
            "description": "Manage customer support tickets"
          }
        ]
      },
      "RetailGmbH": {
        "screens": [
          {
            "name": "Support Tickets",
            "url": "/support",
            "icon": "ticket",
            "description": "Manage customer support tickets"
          }
        ]
      }
    };
  }
};
router.get('/screens', async (req, res) => {
  try {
    const registry = loadRegistry();
    const userTenant = req.user.customerId;

    console.log('🔍 Looking for tenant:', userTenant);
    console.log('📋 Available tenants:', Object.keys(registry));

    const tenantData = registry[userTenant];
    if (!tenantData) {
      console.log('Tenant not found:', userTenant);
      return res.status(404).json({
        error: 'No screens configured for this tenant',
        customerId: userTenant,
        availableTenants: Object.keys(registry) 
      });
    }

    let screens = tenantData.screens || [];
    console.log('📱 Found screens:', screens.length);
    if (req.user.role === 'User') {
      screens = screens.filter(screen => !screen.adminOnly);
    }
    return res.json(screens);

  } catch (error) {
    console.error('Get screens error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/profile', async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.userId,
        email: req.user.email,
        customerId: req.user.customerId,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
router.get('/tenant-info', async (req, res) => {
  try {
    const registry = loadRegistry();
    const userTenant = req.user.customerId;

    console.log('Looking for tenant info:', userTenant);

    const tenantData = registry[userTenant];
    if (!tenantData) {
      console.log('Tenant not found for tenant-info:', userTenant);
      return res.status(404).json({
        error: 'Tenant not found',
        customerId: userTenant,
        availableTenants: Object.keys(registry)
      });
    }

    res.json({
      customerId: userTenant,
      tenantName: tenantData.name || userTenant,
      description: tenantData.description || '',
      settings: tenantData.settings || {},
      features: tenantData.features || [],
      branding: tenantData.branding || {}
    });

  } catch (error) {
    console.error('Get tenant info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;