# 🧪 PLAN DE TESTING Y QA - OpenTalkWisp

**Proyecto:** CRM Omnicanal SaaS Multi-Empresa  
**Fecha:** 10 de diciembre de 2025  
**Documento:** 07 - Testing y Quality Assurance

---

## 🎯 OBJETIVO

Establecer una estrategia completa de testing que garantice:
- ✅ Código libre de bugs críticos
- ✅ Funcionalidad correcta en todos los navegadores
- ✅ Performance óptimo con miles de usuarios
- ✅ Seguridad robusta (multi-tenancy sin leaks)
- ✅ Experiencia de usuario excelente

---

## 📊 PIRÁMIDE DE TESTING

```
                  ╱╲
                 ╱  ╲
                ╱ E2E ╲              70 tests (5%)
               ╱──────╲
              ╱        ╲
             ╱Integration╲            200 tests (15%)
            ╱────────────╲
           ╱              ╲
          ╱  Unit Tests    ╲          1,000+ tests (80%)
         ╱──────────────────╲
```

**Distribución recomendada:**
- 80% Unit Tests (rápidos, específicos)
- 15% Integration Tests (módulos completos)
- 5% E2E Tests (flujos completos usuario)

---

## 🔧 UNIT TESTS (Backend)

### Framework: Jest + Supertest

**Configuración:**
```javascript
// jest.config.js
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/*.(t|j)s',
    '!**/*.spec.ts',
    '!**/*.e2e-spec.ts',
    '!**/node_modules/**',
    '!**/dist/**',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};
```

### Ejemplos de Unit Tests

#### 1. Services Tests
```typescript
// src/modules/contacts/contacts.service.spec.ts

describe('ContactsService', () => {
  let service: ContactsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContactsService,
        {
          provide: PrismaService,
          useValue: mockDeep<PrismaClient>(),
        },
      ],
    }).compile();

    service = module.get<ContactsService>(ContactsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('create', () => {
    it('should create a contact successfully', async () => {
      const createDto = {
        phoneNumber: '+1234567890',
        name: 'John Doe',
        email: 'john@example.com',
      };

      const mockContact = {
        id: 'uuid',
        organizationId: 'org-uuid',
        ...createDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.contact.create = jest.fn().mockResolvedValue(mockContact);

      const result = await service.create('org-uuid', createDto);

      expect(result).toEqual(mockContact);
      expect(prisma.contact.create).toHaveBeenCalledWith({
        data: {
          organizationId: 'org-uuid',
          ...createDto,
        },
      });
    });

    it('should throw error on duplicate phone number', async () => {
      const createDto = {
        phoneNumber: '+1234567890',
        name: 'John Doe',
      };

      prisma.contact.create = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: '5.0.0',
        })
      );

      await expect(service.create('org-uuid', createDto)).rejects.toThrow(
        ConflictException
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated contacts', async () => {
      const mockContacts = [
        { id: '1', name: 'John' },
        { id: '2', name: 'Jane' },
      ];

      prisma.contact.findMany = jest.fn().mockResolvedValue(mockContacts);
      prisma.contact.count = jest.fn().mockResolvedValue(2);

      const result = await service.findAll('org-uuid', {
        page: 1,
        limit: 10,
      });

      expect(result.data).toEqual(mockContacts);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
    });

    it('should filter by tags', async () => {
      prisma.contact.findMany = jest.fn().mockResolvedValue([]);

      await service.findAll('org-uuid', {
        tags: ['vip', 'premium'],
      });

      expect(prisma.contact.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { hasEvery: ['vip', 'premium'] },
          }),
        })
      );
    });
  });

  describe('update', () => {
    it('should update contact', async () => {
      const updateDto = { name: 'John Updated' };
      const mockContact = { id: 'uuid', name: 'John Updated' };

      prisma.contact.update = jest.fn().mockResolvedValue(mockContact);

      const result = await service.update('org-uuid', 'uuid', updateDto);

      expect(result.name).toBe('John Updated');
    });

    it('should throw NotFoundException if contact not found', async () => {
      prisma.contact.update = jest.fn().mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Record not found', {
          code: 'P2025',
          clientVersion: '5.0.0',
        })
      );

      await expect(
        service.update('org-uuid', 'invalid-uuid', { name: 'Test' })
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete contact and related data', async () => {
      prisma.contact.delete = jest.fn().mockResolvedValue({ id: 'uuid' });

      await service.delete('org-uuid', 'uuid');

      expect(prisma.contact.delete).toHaveBeenCalledWith({
        where: {
          id: 'uuid',
          organizationId: 'org-uuid',
        },
      });
    });
  });
});
```

#### 2. Controllers Tests
```typescript
// src/modules/contacts/contacts.controller.spec.ts

describe('ContactsController', () => {
  let controller: ContactsController;
  let service: ContactsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    service = module.get<ContactsService>(ContactsService);
  });

  describe('create', () => {
    it('should create a contact', async () => {
      const createDto = {
        phoneNumber: '+1234567890',
        name: 'John Doe',
      };

      const mockContact = { id: 'uuid', ...createDto };
      jest.spyOn(service, 'create').mockResolvedValue(mockContact);

      const result = await controller.create(
        { user: { organizationId: 'org-uuid' } } as any,
        createDto
      );

      expect(result).toEqual(mockContact);
      expect(service.create).toHaveBeenCalledWith('org-uuid', createDto);
    });
  });

  describe('findAll', () => {
    it('should return all contacts', async () => {
      const mockResult = {
        data: [],
        total: 0,
        page: 1,
        limit: 10,
      };

      jest.spyOn(service, 'findAll').mockResolvedValue(mockResult);

      const result = await controller.findAll(
        { user: { organizationId: 'org-uuid' } } as any,
        {}
      );

      expect(result).toEqual(mockResult);
    });
  });
});
```

#### 3. Guards Tests
```typescript
// src/core/guards/tenant.guard.spec.ts

describe('TenantGuard', () => {
  let guard: TenantGuard;

  beforeEach(() => {
    guard = new TenantGuard();
  });

  it('should allow access when organizationId matches', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { organizationId: 'org-1' },
          params: { organizationId: 'org-1' },
        }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when organizationId does not match', () => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({
          user: { organizationId: 'org-1' },
          params: { organizationId: 'org-2' },
        }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
```

### Coverage Target: 80%+

```bash
# Ejecutar tests con coverage
pnpm test:cov

# Ver reporte HTML
open coverage/lcov-report/index.html
```

---

## 🔗 INTEGRATION TESTS

### Objetivo
Probar módulos completos con base de datos real.

**Setup:**
```typescript
// test/integration/setup.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { PrismaService } from '@/infrastructure/database/prisma.service';

export async function setupTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  
  // Apply same config as main.ts
  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalInterceptors(new TenantInterceptor());
  
  await app.init();
  
  // Clean database before each test
  const prisma = app.get(PrismaService);
  await prisma.cleanDatabase(); // Helper method
  
  return app;
}
```

### Ejemplo Integration Test

```typescript
// test/integration/contacts.e2e-spec.ts

describe('Contacts (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let organizationId: string;

  beforeAll(async () => {
    app = await setupTestApp();
    prisma = app.get(PrismaService);
    
    // Create test organization and user
    const org = await prisma.organization.create({
      data: { name: 'Test Org', subdomain: 'test' },
    });
    organizationId = org.id;
    
    const user = await prisma.user.create({
      data: {
        organizationId: org.id,
        email: 'test@example.com',
        password: await bcrypt.hash('password', 10),
        name: 'Test User',
        role: 'ADMIN',
      },
    });
    
    // Get auth token
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
    
    authToken = response.body.accessToken;
  });

  afterAll(async () => {
    await prisma.cleanDatabase();
    await app.close();
  });

  describe('POST /contacts', () => {
    it('should create a contact', async () => {
      const response = await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: '+1234567890',
          name: 'John Doe',
          email: 'john@example.com',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        phoneNumber: '+1234567890',
        name: 'John Doe',
        email: 'john@example.com',
        organizationId,
      });
      
      // Verify in database
      const contact = await prisma.contact.findUnique({
        where: { id: response.body.id },
      });
      expect(contact).toBeDefined();
    });

    it('should return 400 for invalid phone number', async () => {
      await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: 'invalid',
          name: 'John Doe',
        })
        .expect(400);
    });

    it('should return 409 for duplicate phone number', async () => {
      // Create first contact
      await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: '+1111111111',
          name: 'First',
        });

      // Try to create duplicate
      await request(app.getHttpServer())
        .post('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phoneNumber: '+1111111111',
          name: 'Second',
        })
        .expect(409);
    });
  });

  describe('GET /contacts', () => {
    beforeEach(async () => {
      // Seed contacts
      await prisma.contact.createMany({
        data: [
          { organizationId, phoneNumber: '+1111', name: 'Contact 1', tags: ['vip'] },
          { organizationId, phoneNumber: '+2222', name: 'Contact 2', tags: ['demo'] },
          { organizationId, phoneNumber: '+3333', name: 'Contact 3' },
        ],
      });
    });

    it('should return paginated contacts', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 2 })
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.total).toBe(3);
      expect(response.body.page).toBe(1);
    });

    it('should filter by tags', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ tags: 'vip' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].tags).toContain('vip');
    });

    it('should search by name', async () => {
      const response = await request(app.getHttpServer())
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Contact 2' })
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe('Contact 2');
    });
  });

  describe('Tenant Isolation', () => {
    it('should not return contacts from other organizations', async () => {
      // Create another org and contact
      const org2 = await prisma.organization.create({
        data: { name: 'Other Org', subdomain: 'other' },
      });
      
      await prisma.contact.create({
        data: {
          organizationId: org2.id,
          phoneNumber: '+9999999999',
          name: 'Other Contact',
        },
      });

      // Query contacts (should only return from test org)
      const response = await request(app.getHttpServer())
        .get('/contacts')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.data.every(c => c.organizationId === organizationId)).toBe(true);
    });
  });
});
```

---

## 🌐 E2E TESTS (End-to-End)

### Framework: Playwright

**Setup:**
```typescript
// e2e/playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

### Ejemplos E2E Tests

```typescript
// e2e/tests/auth.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="email"]', 'wrong@example.com');
    await page.fill('input[name="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    await expect(page.locator('[role="alert"]')).toContainText('Invalid credentials');
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'Admin123!');
    await page.click('button[type="submit"]');

    // Logout
    await page.click('button[aria-label="User menu"]');
    await page.click('text=Logout');

    await expect(page).toHaveURL('/login');
  });
});
```

```typescript
// e2e/tests/contacts.spec.ts

import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './helpers/auth';

test.describe('Contacts Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should create a new contact', async ({ page }) => {
    await page.goto('/contacts');
    
    await page.click('button:has-text("New Contact")');
    
    await page.fill('input[name="phoneNumber"]', '+1234567890');
    await page.fill('input[name="name"]', 'John Doe');
    await page.fill('input[name="email"]', 'john@example.com');
    
    await page.click('button:has-text("Create")');

    await expect(page.locator('[role="alert"]')).toContainText('Contact created');
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('should search contacts', async ({ page }) => {
    await page.goto('/contacts');
    
    await page.fill('input[placeholder="Search contacts..."]', 'Alice');
    await page.press('input[placeholder="Search contacts..."]', 'Enter');

    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.locator('text=Alice')).toBeVisible();
  });

  test('should filter by tags', async ({ page }) => {
    await page.goto('/contacts');
    
    await page.click('button:has-text("Filters")');
    await page.click('text=VIP');
    await page.click('button:has-text("Apply")');

    const rows = page.locator('tbody tr');
    const count = await rows.count();
    
    for (let i = 0; i < count; i++) {
      await expect(rows.nth(i)).toContainText('vip');
    }
  });

  test('should import contacts from CSV', async ({ page }) => {
    await page.goto('/contacts');
    
    await page.click('button:has-text("Import")');
    
    // Upload CSV file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('./fixtures/contacts.csv');
    
    await page.click('button:has-text("Upload")');

    await expect(page.locator('text=5 contacts imported')).toBeVisible();
  });
});
```

```typescript
// e2e/tests/conversations.spec.ts

test.describe('Conversations', () => {
  test('should send and receive messages', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/conversations');

    // Select conversation
    await page.click('text=Alice Johnson');

    // Send message
    await page.fill('textarea[placeholder="Type a message..."]', 'Hello Alice!');
    await page.click('button[aria-label="Send"]');

    // Verify message appears
    await expect(page.locator('text=Hello Alice!')).toBeVisible();
    
    // Verify timestamp
    await expect(page.locator('[data-message-status="sent"]')).toBeVisible();
  });

  test('should assign conversation to agent', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/conversations');

    await page.click('text=Bob Smith');
    
    await page.click('button:has-text("Assign")');
    await page.click('text=John Agent');

    await expect(page.locator('text=Assigned to John Agent')).toBeVisible();
  });

  test('should receive real-time messages', async ({ browser }) => {
    // Open two pages (simulate two agents)
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    await loginAsAdmin(page1);
    
    const context2 = await browser.newContext();
    const page2 = await context2.newPage();
    await loginAsAdmin(page2);

    // Both open same conversation
    await page1.goto('/conversations');
    await page1.click('text=Alice Johnson');
    
    await page2.goto('/conversations');
    await page2.click('text=Alice Johnson');

    // Send message from page1
    await page1.fill('textarea[placeholder="Type a message..."]', 'Test real-time');
    await page1.click('button[aria-label="Send"]');

    // Verify it appears in page2 instantly
    await expect(page2.locator('text=Test real-time')).toBeVisible({ timeout: 5000 });
  });
});
```

---

## 🔒 SECURITY TESTS

### 1. Multi-Tenancy Isolation

```typescript
// test/security/tenant-isolation.spec.ts

describe('Tenant Isolation Security', () => {
  it('should not allow access to other organization data', async () => {
    // Create 2 orgs with users
    const org1 = await createOrganization('Org 1');
    const org2 = await createOrganization('Org 2');
    
    const user1 = await createUser(org1.id);
    const user2 = await createUser(org2.id);
    
    const token1 = generateToken(user1);
    const token2 = generateToken(user2);

    // Create contact in org1
    const contact = await request(app)
      .post('/contacts')
      .set('Authorization', `Bearer ${token1}`)
      .send({ phoneNumber: '+1111', name: 'Org 1 Contact' });

    // Try to access from org2 (should fail)
    await request(app)
      .get(`/contacts/${contact.body.id}`)
      .set('Authorization', `Bearer ${token2}`)
      .expect(403);
  });

  it('should not allow SQL injection in filters', async () => {
    const response = await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${token}`)
      .query({ search: "'; DROP TABLE contacts; --" })
      .expect(200);

    // Should return empty or sanitized results, not error
    expect(response.body.data).toBeDefined();
  });

  it('should rate limit API requests', async () => {
    // Make 100 requests rapidly
    const promises = Array(100).fill(null).map(() =>
      request(app)
        .get('/contacts')
        .set('Authorization', `Bearer ${token}`)
    );

    const results = await Promise.all(promises);
    
    // Some should be rate limited (429)
    const rateLimited = results.filter(r => r.status === 429);
    expect(rateLimited.length).toBeGreaterThan(0);
  });
});
```

### 2. Authentication Tests

```typescript
describe('Authentication Security', () => {
  it('should reject expired tokens', async () => {
    const expiredToken = generateToken(user, { expiresIn: '-1h' });

    await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });

  it('should reject tampered tokens', async () => {
    const validToken = generateToken(user);
    const tamperedToken = validToken.slice(0, -5) + 'xxxxx';

    await request(app)
      .get('/contacts')
      .set('Authorization', `Bearer ${tamperedToken}`)
      .expect(401);
  });

  it('should hash passwords securely', async () => {
    const user = await prisma.user.findFirst();
    
    // Password should be hashed, not plain text
    expect(user.password).not.toBe('Admin123!');
    expect(user.password.startsWith('$2b$')).toBe(true); // bcrypt hash
  });
});
```

---

## 📊 PERFORMANCE TESTS

### Framework: k6

```javascript
// k6/load-test.js

import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up to 200 users
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Less than 1% errors
  },
};

const BASE_URL = 'http://localhost:3000';
let authToken;

export function setup() {
  // Login and get token
  const loginRes = http.post(`${BASE_URL}/auth/login`, JSON.stringify({
    email: 'test@example.com',
    password: 'password',
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  return { token: loginRes.json('accessToken') };
}

export default function(data) {
  const headers = {
    'Authorization': `Bearer ${data.token}`,
    'Content-Type': 'application/json',
  };

  // Test 1: List contacts
  let res = http.get(`${BASE_URL}/contacts`, { headers });
  check(res, {
    'list contacts status 200': (r) => r.status === 200,
    'list contacts duration < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);

  // Test 2: Get single contact
  res = http.get(`${BASE_URL}/contacts/some-id`, { headers });
  check(res, {
    'get contact status 200 or 404': (r) => [200, 404].includes(r.status),
  });

  sleep(1);

  // Test 3: Search contacts
  res = http.get(`${BASE_URL}/contacts?search=test`, { headers });
  check(res, {
    'search contacts status 200': (r) => r.status === 200,
    'search duration < 1s': (r) => r.timings.duration < 1000,
  });

  sleep(2);
}

export function teardown(data) {
  // Cleanup if needed
}
```

**Ejecutar:**
```bash
k6 run k6/load-test.js
```

---

## 🎨 VISUAL REGRESSION TESTS

### Framework: Percy

```typescript
// e2e/tests/visual/pages.spec.ts

import { test } from '@playwright/test';
import percySnapshot from '@percy/playwright';

test.describe('Visual Regression', () => {
  test('dashboard page', async ({ page }) => {
    await page.goto('/dashboard');
    await percySnapshot(page, 'Dashboard');
  });

  test('contacts list', async ({ page }) => {
    await page.goto('/contacts');
    await percySnapshot(page, 'Contacts List');
  });

  test('conversation chat', async ({ page }) => {
    await page.goto('/conversations');
    await page.click('text=Alice Johnson');
    await percySnapshot(page, 'Conversation Chat');
  });

  test('pipeline view', async ({ page }) => {
    await page.goto('/pipeline');
    await percySnapshot(page, 'Pipeline Kanban');
  });
});
```

---

## 🤖 AUTOMATED TESTING CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml

name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Setup pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8
          
      - name: Install dependencies
        run: pnpm install
        
      - name: Run migrations
        run: pnpm db:migrate
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          
      - name: Run unit tests
        run: pnpm test:cov
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    
    steps:
      # ... similar setup
      
      - name: Run integration tests
        run: pnpm test:e2e

  e2e-tests:
    runs-on: ubuntu-latest
    needs: integration-tests
    
    steps:
      # ... similar setup
      
      - name: Install Playwright
        run: pnpm playwright install --with-deps
        
      - name: Run E2E tests
        run: pnpm test:playwright
        
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 📋 TEST CHECKLIST PRE-RELEASE

### Backend
```
✅ Unit tests pass (coverage >80%)
✅ Integration tests pass
✅ Security tests pass (tenant isolation, auth)
✅ Performance tests pass (p95 < 500ms)
✅ API documentation up to date
✅ Database migrations tested
✅ Error handling comprehensive
✅ Logging implemented
```

### Frontend
```
✅ E2E tests pass (critical flows)
✅ Visual regression tests pass
✅ Cross-browser tested (Chrome, Firefox, Safari)
✅ Mobile responsive tested
✅ Accessibility (a11y) tested
✅ Performance (Lighthouse >90)
✅ Error boundaries implemented
✅ Loading states for all async actions
```

### Infrastructure
```
✅ Docker build successful
✅ Environment variables documented
✅ Backup/restore tested
✅ Monitoring configured
✅ Alerts configured
✅ Rollback procedure documented
```

---

## ✅ CONCLUSIÓN

**Estrategia de Testing Completa:**
- ✅ 80% unit tests (rápidos, específicos)
- ✅ 15% integration tests (módulos completos)
- ✅ 5% E2E tests (flujos usuario)
- ✅ Security tests (multi-tenancy crítico)
- ✅ Performance tests (load testing)
- ✅ Visual regression (UI consistency)
- ✅ CI/CD automatizado

**Timeline Testing:**
- Desde día 1: Unit tests obligatorios
- Mes 2: Integration tests
- Mes 3: E2E tests básicos
- Mes 6: Performance tests
- Mes 9: Security audit completo

**Siguiente:** `ANALISIS-08-DESPLIEGUE-DEVOPS.md`

