describe('Flowbit Smoke Test', () => {
  it('Logs in, creates ticket, sees update', () => {
    cy.visit('http://localhost:3000/login');

    cy.get('input[type="email"]').type('admin@logisticsco.com');
    cy.get('input[type="password"]').type('StrongDemo@2025!');
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/support');
    cy.wait(1000);

    cy.contains('Create Support Ticket');

    cy.get('input[name="title"]').type('Smoke Test Ticket');
    cy.get('textarea[name="description"]').type('This is a test ticket from Cypress');
    cy.get('button[type="submit"]').click();

    cy.contains('Ticket submitted successfully');
  });
});
