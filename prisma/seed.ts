import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function seed() {
  console.log('🌱 Starting database seed...')

  // 1. Find existing user (from the user's request)
  let user = await prisma.user.findUnique({
    where: { email: "prahmani082@gmail.com" }
  })

  // If user doesn't exist, create a demo user for development
  if (!user) {
    console.log('❌ User with email "prahmani@82@gmail.com" not found.')
    console.log('📝 Creating demo user for development...')
    
    user = await prisma.user.upsert({
      where: { email: 'demo@taskmanager.dev' },
      update: {},
      create: {
        email: 'demo@taskmanager.dev',
        name: 'Demo User',
        image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
      },
    })
    console.log('✅ Demo user created')
  } else {
    console.log('✅ Found existing user:', user.email)
  }

  // 2. Create sample tags
  console.log('🏷️  Creating tags...')
  const urgentTag = await prisma.tag.upsert({
    where: { name: 'urgent' },
    update: {},
    create: { name: 'urgent', color: '#EF4444' },
  })

  const frontendTag = await prisma.tag.upsert({
    where: { name: 'frontend' },
    update: {},
    create: { name: 'frontend', color: '#3B82F6' },
  })

  const backendTag = await prisma.tag.upsert({
    where: { name: 'backend' },
    update: {},
    create: { name: 'backend', color: '#10B981' },
  })

  const designTag = await prisma.tag.upsert({
    where: { name: 'design' },
    update: {},
    create: { name: 'design', color: '#8B5CF6' },
  })

  const bugTag = await prisma.tag.upsert({
    where: { name: 'bug' },
    update: {},
    create: { name: 'bug', color: '#F59E0B' },
  })

  const apiTag = await prisma.tag.upsert({
    where: { name: 'api' },
    update: {},
    create: { name: 'api', color: '#06B6D4' },
  })

  const testingTag = await prisma.tag.upsert({
    where: { name: 'testing' },
    update: {},
    create: { name: 'testing', color: '#84CC16' },
  })

  console.log('✅ Tags created')

  // 3. Create sample projects
  console.log('📁 Creating projects...')
  
  // Clear existing projects for this user to avoid duplicates
  await prisma.task.deleteMany({ where: { userId: user.id } })
  await prisma.project.deleteMany({ where: { userId: user.id } })

  const webAppProject = await prisma.project.create({
    data: {
      name: 'E-commerce Platform',
      description: 'Full-stack e-commerce platform with React and Node.js',
      color: '#3B82F6',
      userId: user.id,
    },
  })

  const mobileAppProject = await prisma.project.create({
    data: {
      name: 'Task Manager Mobile',
      description: 'Cross-platform mobile app for task management',
      color: '#10B981',
      userId: user.id,
    },
  })

  const devOpsProject = await prisma.project.create({
    data: {
      name: 'Infrastructure & DevOps',
      description: 'Cloud infrastructure and deployment automation',
      color: '#8B5CF6',
      userId: user.id,
    },
  })

  console.log('✅ Projects created')

  // 4. Create realistic sample tasks with varied statuses, priorities, and deadlines
  console.log('📋 Creating tasks...')
  
  const tasks = [
    // E-commerce Platform tasks
    {
      title: 'Implement database connection',
      description: 'Set up Prisma with MongoDB and create connection utilities for the e-commerce platform',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      deadline: new Date('2024-12-20'),
      projectId: webAppProject.id,
      order: 1,
      tags: [backendTag.id, apiTag.id],
    },
    {
      title: 'Design product catalog UI',
      description: 'Create responsive product catalog with search, filters, and pagination',
      status: 'DONE',
      priority: 'HIGH',
      deadline: new Date('2024-12-15'),
      projectId: webAppProject.id,
      order: 2,
      tags: [frontendTag.id, designTag.id],
    },
    {
      title: 'Build shopping cart functionality',
      description: 'Implement add to cart, update quantities, and persist cart state',
      status: 'TODO',
      priority: 'URGENT',
      deadline: new Date('2024-12-22'),
      projectId: webAppProject.id,
      order: 3,
      tags: [frontendTag.id, backendTag.id],
    },
    {
      title: 'Integrate payment gateway',
      description: 'Set up Stripe integration for secure payment processing',
      status: 'TODO',
      priority: 'HIGH',
      deadline: new Date('2024-12-28'),
      projectId: webAppProject.id,
      order: 4,
      tags: [backendTag.id, apiTag.id],
    },
    {
      title: 'Fix responsive checkout bug',
      description: 'Checkout form breaks on mobile devices, buttons not clickable',
      status: 'IN_PROGRESS',
      priority: 'URGENT',
      deadline: new Date('2024-12-18'),
      projectId: webAppProject.id,
      order: 5,
      tags: [bugTag.id, frontendTag.id, urgentTag.id],
    },

    // Mobile App tasks
    {
      title: 'Set up React Native navigation',
      description: 'Configure navigation stack with proper screen transitions',
      status: 'DONE',
      priority: 'MEDIUM',
      deadline: new Date('2024-12-10'),
      projectId: mobileAppProject.id,
      order: 1,
      tags: [frontendTag.id],
    },
    {
      title: 'Implement offline task sync',
      description: 'Allow users to work offline and sync when connection is restored',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      deadline: new Date('2024-12-25'),
      projectId: mobileAppProject.id,
      order: 2,
      tags: [backendTag.id, apiTag.id],
    },
    {
      title: 'Design onboarding flow',
      description: 'Create intuitive onboarding screens for new users',
      status: 'TODO',
      priority: 'LOW',
      deadline: new Date('2025-01-05'),
      projectId: mobileAppProject.id,
      order: 3,
      tags: [designTag.id, frontendTag.id],
    },

    // DevOps tasks
    {
      title: 'Configure CI/CD pipeline',
      description: 'Set up GitHub Actions for automated testing and deployment',
      status: 'DONE',
      priority: 'HIGH',
      deadline: new Date('2024-12-12'),
      projectId: devOpsProject.id,
      order: 1,
      tags: [backendTag.id],
    },
    {
      title: 'Set up monitoring and logging',
      description: 'Implement application monitoring with Datadog and error tracking',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      deadline: new Date('2024-12-30'),
      projectId: devOpsProject.id,
      order: 2,
      tags: [backendTag.id],
    },
    {
      title: 'Write comprehensive tests',
      description: 'Add unit tests, integration tests, and E2E test coverage',
      status: 'TODO',
      priority: 'MEDIUM',
      deadline: new Date('2025-01-10'),
      projectId: devOpsProject.id,
      order: 3,
      tags: [testingTag.id, backendTag.id, frontendTag.id],
    },
    {
      title: 'Optimize database queries',
      description: 'Analyze and optimize slow database queries for better performance',
      status: 'TODO',
      priority: 'LOW',
      deadline: new Date('2025-01-15'),
      projectId: devOpsProject.id,
      order: 4,
      tags: [backendTag.id, apiTag.id],
    },
  ]

  // Create tasks with tag associations
  for (const taskData of tasks) {
    const { tags: taskTagIds, ...taskInfo } = taskData
    
    const task = await prisma.task.create({
      data: {
        ...taskInfo,
        userId: user.id,
      },
    })

    // Connect tags to tasks
    for (const tagId of taskTagIds) {
      await prisma.taskTag.create({
        data: {
          taskId: task.id,
          tagId: tagId,
        },
      })
    }
  }

  console.log('✅ Tasks created')

  // Print summary
  const taskCounts = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'TODO').length,
    inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
    done: tasks.filter(t => t.status === 'DONE').length,
  }

  console.log('📊 Seed Summary:')
  console.log(`   👤 User: ${user.email}`)
  console.log(`   📁 Projects: 3`)
  console.log(`   🏷️  Tags: 7`)
  console.log(`   📋 Tasks: ${taskCounts.total}`)
  console.log(`      • TODO: ${taskCounts.todo}`)
  console.log(`      • IN_PROGRESS: ${taskCounts.inProgress}`)
  console.log(`      • DONE: ${taskCounts.done}`)
  console.log('🎉 Database seeded successfully!')
}

seed()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  }) 