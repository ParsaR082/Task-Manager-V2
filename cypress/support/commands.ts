// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Declare custom commands for TypeScript
declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      waitForPageLoad(): Chainable<void>
      drag(options: { target: string }): Chainable<void>
    }
  }
}

// Login command for authentication testing
Cypress.Commands.add('login', () => {
  cy.session('user-session', () => {
    cy.visit('/')
    
    // Mock successful authentication
    cy.window().then((win) => {
      win.localStorage.setItem('nextauth.session-token', 'mock-session-token')
    })
    
    // Intercept session check
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    }).as('getSession')
    
    cy.visit('/dashboard')
    cy.wait('@getSession')
  })
})

// Wait for page load command
Cypress.Commands.add('waitForPageLoad', () => {
  cy.get('body').should('be.visible')
  cy.wait(500) // Allow for any async operations to complete
})

// Add drag and drop support
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, options) => {
  cy.wrap(subject).trigger('mousedown', { button: 0 })
  cy.get(options.target).trigger('mousemove').trigger('mouseup')
})

export {} 