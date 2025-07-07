// ***********************************************************
// This example support/e2e.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Global error handling
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing the test on uncaught exceptions
  // This is useful for handling third-party library errors
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false
  }
  
  // Handle other specific errors that shouldn't fail tests
  if (err.message.includes('Non-Error promise rejection captured')) {
    return false
  }
  
  // Return true to fail the test for other uncaught exceptions
  return true
})

// Add custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login as a test user
       * @example cy.login()
       */
      login(): Chainable<void>
      
      /**
       * Custom command to wait for page load
       * @example cy.waitForPageLoad()
       */
      waitForPageLoad(): Chainable<void>
    }
  }
} 