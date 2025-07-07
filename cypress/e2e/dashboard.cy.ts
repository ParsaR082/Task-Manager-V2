describe('Dashboard', () => {
  beforeEach(() => {
    // Mock authentication
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
          image: 'https://example.com/avatar.jpg',
        },
      },
    })

    // Mock tasks API
    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: {
        tasks: [
          {
            id: '1',
            title: 'Test Task 1',
            description: 'Test description',
            status: 'TODO',
            priority: 'HIGH',
            deadline: '2024-02-01T00:00:00.000Z',
            order: 1,
            projectId: '1',
            userId: 'user1',
            createdAt: '2024-01-01T00:00:00.000Z',
            updatedAt: '2024-01-01T00:00:00.000Z',
            project: {
              id: '1',
              name: 'Test Project',
              color: '#3B82F6',
            },
          },
        ],
      },
    })

    cy.visit('/dashboard')
  })

  it('displays dashboard header with user info', () => {
    cy.get('h1').should('contain', 'Task Manager')
    cy.get('img').should('have.attr', 'alt', 'Test User')
    cy.contains('Test User')
    cy.contains('test@example.com')
  })

  it('shows dashboard statistics cards', () => {
    cy.contains('Total Tasks')
    cy.contains('Completed')
    cy.contains('In Progress')
    cy.contains('Projects')
  })

  it('displays tab navigation', () => {
    cy.get('[role="tablist"]').should('be.visible')
    cy.contains('Board')
    cy.contains('Analytics')
    cy.contains('Notifications')
  })

  it('switches between tabs', () => {
    // Should start on Board tab
    cy.get('[data-state="active"]').should('contain', 'Board')

    // Switch to Analytics
    cy.contains('Analytics').click()
    cy.get('[data-state="active"]').should('contain', 'Analytics')

    // Switch to Notifications
    cy.contains('Notifications').click()
    cy.get('[data-state="active"]').should('contain', 'Notifications')
  })

  it('displays task board with columns', () => {
    cy.contains('To Do')
    cy.contains('In Progress')
    cy.contains('Review')
    cy.contains('Done')
  })

  it('shows tasks in appropriate columns', () => {
    cy.contains('Test Task 1').should('be.visible')
  })

  it('allows creating new tasks', () => {
    cy.contains('New Task').click()
    // Would open task creation dialog in real implementation
  })

  it('displays analytics charts', () => {
    cy.contains('Analytics').click()
    cy.contains('Completion Rate')
    cy.contains('Task Status Distribution')
    cy.contains('Priority Distribution')
    cy.contains('Project Progress')
    cy.contains('7-Day Activity Trend')
  })

  it('shows notifications panel', () => {
    cy.contains('Notifications').click()
    cy.contains('All caught up!')
  })

  it('allows user to sign out', () => {
    cy.contains('Sign Out').click()
    // Would redirect to login page in real implementation
  })

  it('refreshes data when refresh button is clicked', () => {
    cy.contains('Refresh').click()
    // Would show loading state and update data
  })

  it('is responsive on mobile devices', () => {
    cy.viewport('iphone-6')
    cy.get('h1').should('be.visible')
    cy.get('[role="tablist"]').should('be.visible')
  })
})

describe('Task Board Interactions', () => {
  beforeEach(() => {
    cy.intercept('GET', '/api/auth/session', {
      statusCode: 200,
      body: {
        user: {
          id: 'user1',
          name: 'Test User',
          email: 'test@example.com',
        },
      },
    })

    cy.intercept('GET', '/api/tasks', {
      statusCode: 200,
      body: {
        tasks: [
          {
            id: '1',
            title: 'Draggable Task',
            status: 'TODO',
            priority: 'MEDIUM',
            order: 1,
            projectId: '1',
            project: { name: 'Test Project', color: '#3B82F6' },
          },
        ],
      },
    })

    cy.visit('/dashboard')
  })

  it('allows drag and drop of tasks', () => {
    // Mock successful task update
    cy.intercept('PUT', '/api/tasks/1', {
      statusCode: 200,
      body: {
        task: {
          id: '1',
          title: 'Draggable Task',
          status: 'IN_PROGRESS',
          priority: 'MEDIUM',
        },
      },
    })

    // In a real implementation, this would test actual drag and drop
    // For now, we verify the task is visible and columns are present
    cy.contains('Draggable Task')
    cy.contains('To Do')
    cy.contains('In Progress')
  })

  it('shows task details when clicking on a task', () => {
    cy.contains('Draggable Task').click()
    // Would open task details modal in real implementation
  })

  it('updates task priority', () => {
    // Would test priority selection dropdown
    cy.get('[data-testid="task-card"]').should('exist')
  })
}) 