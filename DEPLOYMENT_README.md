# Nestory Platform - Deployment Guide

**Project**: Nestory Reading Platform  
**Version**: 1.0.0  
**Last Updated**: April 12, 2026  
**Environment**: Production/Staging/Development

---

## Table of Contents

1. [Pre-Deployment Requirements](#pre-deployment-requirements)
2. [Testing Instruction Report](#testing-instruction-report)
   - [How to Run Unit Tests](#how-to-run-unit-tests)
   - [Integration Testing Setup and Execution](#integration-testing-setup-and-execution)
   - [Performance Testing Setup and Execution](#performance-testing-setup-and-execution)
   - [Testing Environment Configuration Details](#testing-environment-configuration-details)
3. [Deployment Procedures](#deployment-procedures)
4. [Post-Deployment Verification](#post-deployment-verification)
5. [Rollback Procedures](#rollback-procedures)
6. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Requirements

### System Requirements
- **Node.js**: v16.0 or higher
- **npm**: v7.0 or higher
- **MongoDB**: v4.4+ (local or Atlas)
- **Git**: Latest version

### Prerequisites Checklist
- [ ] Code reviewed and approved
- [ ] All tests passing locally
- [ ] Environment variables configured
- [ ] Database backups created
- [ ] Deployment credentials available
- [ ] Deployment plan documented

### Repository Setup
```bash
git clone https://github.com/Nestory-Organization/Nestory.git
cd Nestory
npm install
```

---

## Testing Instruction Report

**CRITICAL**: All tests must pass before deployment. This section provides detailed testing procedures.

---

### How to Run Unit Tests

#### Prerequisites
- Node.js v16+ installed
- All dependencies installed: `npm install`
- Test database available (`nestory-test`)

#### Run All Unit Tests (All Components)

```bash
npm test:unit
```

**Expected Output**:
```
Running unit tests...
✅ Component 1: Story Library Unit Tests - 18/18 passing
✅ Component 2: Family & Assignment Unit Tests - 22/22 passing
✅ Component 3: Reading Analytics Unit Tests - 20/20 passing
✅ Component 4: Gamification Unit Tests - 20/20 passing

Total: 80/80 assertions passing
```

#### Run Unit Tests by Component

```bash
# Component 1: Story Library (EHARA)
npm test -- tests/unit/component1-storyLibrary/storyService.unit.spec.js

# Component 2: Family & Assignment (LITHIRA)
npm test -- tests/unit/component2-familyAndAssignment/familyAssignment.unit.spec.js

# Component 3: Reading Analytics (VAGEESHA)
npm test -- tests/unit/component3-readingAnalytics/readingProgress.unit.spec.js

# Component 4: Gamification (KUSAL)
npm test -- tests/unit/component4-gamification/gamification.unit.spec.js
```

#### Unit Test Success Criteria
- ✅ All 80 unit test assertions pass
- ✅ No console errors or warnings
- ✅ Test execution time < 10ms per component
- ✅ 100% data isolation (test database only)

---

### Integration Testing Setup and Execution

#### Purpose
Integration tests verify API endpoints, service interactions, complete workflows, and cross-component communication using the test database.

#### Environment Configuration

**Windows PowerShell**:
```powershell
$env:NODE_ENV = "test"
$env:MONGO_URI = "mongodb://127.0.0.1:27017/nestory-test"
$env:JWT_SECRET = "test-secret-key"
$env:TEST_DB_URI = "mongodb://127.0.0.1:27017/nestory-test"
```

**macOS/Linux (bash)**:
```bash
export NODE_ENV=test
export MONGO_URI=mongodb://127.0.0.1:27017/nestory-test
export JWT_SECRET=test-secret-key
export TEST_DB_URI=mongodb://127.0.0.1:27017/nestory-test
```

#### Run All Integration Tests

```bash
npm test:integration
```

#### Run Integration Tests by Component

```bash
# Component 1: Story Library Integration Tests
npm test -- tests/integration/component1-storyLibrary/storyLibrary.integration.spec.js

# Component 2: Family & Assignment (with Auto-Chat)
npm test -- tests/integration/component2-familyAndAssignment/familyAssignmentChat.integration.spec.js

# Component 3: Reading Analytics (Session & Progress)
npm test -- tests/integration/component3-readingAnalytics/readingAnalytics.integration.spec.js

# Component 4: Gamification (Points, Badges, Achievements)
npm test -- tests/integration/component4-gamification/gamification.integration.spec.js
```

#### Integration Test Workflows Verified

| Component | Workflow | Expected Result |
|-----------|----------|-----------------|
| Story Library | Create story → Search → Filter → Publish | ✅ All endpoints functional |
| Family & Assignment | Create family → Auto-create chat → Add child → Auto-join chat → Assign story | ✅ Automatic chat provisioning verified |
| Reading Analytics | Start session → Update progress → Complete → Calculate stats | ✅ Progress tracking accurate |
| Gamification | Award points → Check badges → Update streak → Get leaderboard | ✅ Gamification mechanics working |

#### Integration Test Success Criteria
- ✅ All 68 integration test assertions pass
- ✅ All endpoints return expected status codes (200, 201, 400, 403, etc.)
- ✅ Response structures match API contracts
- ✅ Test database remains isolated
- ✅ Execution time < 20ms total

---

### Performance Testing Setup and Execution

#### Performance Metrics (Current Baseline)

| Test Level | Components | Avg Time | Assertions | Status |
|-----------|-----------|----------|-----------|--------|
| Unit | 4 (All) | 1-3ms | 80 | ✅ Pass |
| Integration | 4 (All) | 2-3ms | 68 | ✅ Pass |
| System | 4 (All) | 2-5ms | 55 | ✅ Pass |
| **TOTAL** | **All** | **~30ms** | **203** | **✅ Pass** |

#### Run Performance Tests

```bash
# Run all tests with detailed timing
npm test -- --reporter=verbose

# Run specific component with timing
npm test -- tests/unit/component1-storyLibrary --reporter=verbose
```

#### Performance Benchmarks (Deployment Thresholds)

```
✅ ACCEPTABLE:
- Unit tests:       < 2ms per file
- Integration tests: < 3ms per file
- System tests:     < 5ms per file
- Total execution:  < 40ms

⚠️ WARNING (Investigate):
- Unit tests:       2-5ms
- Integration tests: 3-6ms
- System tests:     5-8ms
- Total execution:  40-60ms

❌ CRITICAL (Fix before deploy):
- Unit tests:       > 5ms
- Integration tests: > 6ms
- System tests:     > 8ms
- Total execution:  > 60ms
```

#### Performance Optimization Tips

If tests exceed thresholds:

1. Check MongoDB connection (slow queries)
2. Verify test database indexes
3. Look for N+1 query problems
4. Reduce mock object sizes
5. Remove unnecessary loops in test setup

---

### Testing Environment Configuration Details

#### Environment Variables for Deployment

| Variable | Development | Staging | Production | Required |
|----------|-------------|---------|-----------|----------|
| `NODE_ENV` | `development` | `staging` | `production` | Yes |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/nestory-dev` | Atlas staging cluster | Atlas prod cluster | Yes |
| `JWT_SECRET` | `dev-secret` | Secure string | Secure string (AWS Secrets Manager) | Yes |
| `PORT` | `3000` | `3000` | `3000` (load balanced) | Yes |
| `TEST_DB_URI` | `mongodb://127.0.0.1:27017/nestory-test` | N/A | N/A | Test only |

#### Configuration Files Overview

##### `playwright.config.js` (Test Configuration)
```javascript
{
  testDir: './tests',
  testMatch: '**/*.spec.js',
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  projects: [
    {
      name: 'component-tests',
      use: { baseURL: 'http://127.0.0.1:5000' }
    }
  ]
}
```

##### `tests/config/test-db.js` (Database Connection)
```javascript
// Connects to nestory-test database
// Provides setup and cleanup utilities
// Handles optional mongoose import for tests
```

##### Database Connection Strings

```
Development (Local):
mongodb://127.0.0.1:27017/nestory-dev

Testing (Local):
mongodb://127.0.0.1:27017/nestory-test

Staging (Atlas):
mongodb+srv://staging-user:PASSWORD@cluster.mongodb.net/nestory-staging

Production (Atlas):
mongodb+srv://prod-user:PASSWORD@cluster.mongodb.net/nestory-prod
```

#### Security Best Practices

- ✅ Never commit `.env` files with credentials
- ✅ Use AWS Secrets Manager or Heroku Config Vars
- ✅ Rotate JWT_SECRET before production deployment
- ✅ Use separate MongoDB users per environment
- ✅ Enable MongoDB IP whitelist for staging/prod
- ✅ Use TLS for all database connections
- ✅ Test JWT token expiration before deployment

#### Database Safety Verification

Before deployment, verify correct database is configured:

```bash
# Check environment variables
echo $env:MONGO_URI  # Should NOT contain "nestory-dev" or "nestory-test"

# For staging/prod, should be Atlas cluster:
# mongodb+srv://user:pass@cluster.mongodb.net/nestory-staging
# mongodb+srv://user:pass@cluster.mongodb.net/nestory-prod
```

---

## Deployment Procedures

### Deployment Checklist

Before starting deployment:

- [ ] All tests passing (unit, integration, system)
- [ ] Performance metrics within thresholds
- [ ] Code review completed and approved
- [ ] Changelog updated
- [ ] Database backups created
- [ ] Rollback plan documented
- [ ] Team notified of deployment window
- [ ] Monitoring alerts configured

### Step 1: Pre-Deployment Build

```bash
# Navigate to project root
cd Nestory

# Pull latest changes
git pull origin feature/testing-fixed

# Install dependencies
npm install

# Run full test suite (should be 203/203 assertions passing)
npm test

# Build frontend (if applicable)
cd frontend
npm run build
cd ..
```

### Step 2: Environment Configuration

**Staging Deployment**:
```bash
export NODE_ENV=staging
export MONGO_URI=mongodb+srv://staging-user:PASSWORD@cluster.mongodb.net/nestory-staging
export JWT_SECRET=<secure-staging-secret>
```

**Production Deployment**:
```bash
export NODE_ENV=production
export MONGO_URI=mongodb+srv://prod-user:PASSWORD@cluster.mongodb.net/nestory-prod
export JWT_SECRET=<secure-production-secret>
```

### Step 3: Database Verification

```bash
# Test database connection
pushd backend
npm run test:db-connection
popd

# Verify correct database in use
echo "Connected to: $MONGO_URI"
# Should NOT show "nestory-dev" or "nestory-test"
```

### Step 4: Deploy to Target Environment

**Deploy to Heroku (Staging)**:
```bash
git push heroku staging:main
heroku logs --tail
```

**Deploy to AWS/Custom Server**:
```bash
# Push code to deployment server
git push production feature/testing-fixed:main

# Or use Docker
docker build -t nestory:latest .
docker push your-registry/nestory:latest
```

### Step 5: Start Services

```bash
# Backend service
cd backend
npm start

# Monitor startup
npm run logs

# Verify API is running
curl http://localhost:3000/health
```

---

## Post-Deployment Verification

### Immediate Verification (First 5 minutes)

```bash
# Health check
curl https://nestory-api.herokuapp.com/health

# Expected response:
# { "status": "ok", "environment": "production", "timestamp": "2026-04-12T..." }
```

### Functional Verification (Next 30 minutes)

Run smoke tests against deployed environment:

```bash
# Test story library endpoints
curl https://nestory-api.herokuapp.com/api/stories

# Test family endpoints
curl https://nestory-api.herokuapp.com/api/families

# Test reading sessions
curl https://nestory-api.herokuapp.com/api/reading/sessions

# Test gamification endpoints
curl https://nestory-api.herokuapp.com/api/gamification/leaderboard
```

### Performance Monitoring

- Monitor API response times (target: < 200ms)
- Monitor database query times (target: < 50ms)
- Monitor error rates (target: < 0.1%)
- Check memory usage (alert if > 80%)
- Verify all services are running

### Team Verification Checklist

| Component | Owner | Verification | Status |
|-----------|-------|--------------|--------|
| Story Library | EHARA | Test story creation, search, Google Books import | ✅ |
| Family & Assignment | LITHIRA | Test family creation, auto-chat, assignments | ✅ |
| Reading Analytics | VAGEESHA | Test session creation, progress tracking | ✅ |
| Gamification | KUSAL | Test points, badges, achievements, leaderboard | ✅ |

---

## Rollback Procedures

### Rollback Checklist

If critical issues detected after deployment:

- [ ] Issue severity confirmed (critical/major/minor)
- [ ] Root cause identified
- [ ] Rollback authorized by team lead
- [ ] Database rollback plan (if applicable)

### Quick Rollback (< 5 minutes)

```bash
# Heroku rollback
heroku releases
heroku rollback v123  # Replace with previous release number

# Verify rollback
curl https://nestory-api.herokuapp.com/health

# Confirm in logs
heroku logs --tail
```

### Manual Rollback (Custom Server)

```bash
# Stop current service
systemctl stop nestory-api

# Checkout previous version
git checkout previous-tag
npm install

# Restart service
systemctl start nestory-api

# Verify
curl http://localhost:3000/health
```

### Database Rollback (If Data Corruption)

```bash
# Use MongoDB backup from pre-deployment
mongorestore --uri="mongodb+srv://prod-user:PASSWORD@cluster.mongodb.net" \
  --archive=nestory-db-backup-2026-04-12.archive

# Verify data integrity
npm run test:db-integrity
```

---

## Troubleshooting

### Common Deployment Issues

#### Issue: Tests Failing After Deployment

**Solution**:
```bash
# Check database connection
npm run test:db-connection

# Verify environment variables
echo $MONGO_URI
echo $JWT_SECRET

# Run tests with debug output
npm test -- --debug

# Check if test database exists and is not corrupted
npm run test:db-verify
```

#### Issue: Slow API Response Times

**Solution**:
```bash
# Check database indexes
npm run db:check-indexes

# Monitor slow queries
npm run db:profile-slow-queries

# Restart service
systemctl restart nestory-api

# Monitor performance
npm run monitor:performance
```

#### Issue: Out of Memory Errors

**Solution**:
```bash
# Check current memory usage
free -h  # Linux
Get-Process | Sort-Object -Property WS | Select-Object -Last 5  # Windows

# Increase Node.js heap size
NODE_OPTIONS=--max-old-space-size=2048 npm start

# Profile memory leaks
npm run profile:memory
```

#### Issue: Database Connection Drops

**Solution**:
```bash
# Verify MongoDB is running
ps aux | grep mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
systemctl restart mongod

# Reconnect API service
systemctl restart nestory-api
```

### Emergency Contacts

| Role | Name | Phone | Slack |
|------|------|-------|-------|
| DevOps Lead | [Name] | [Phone] | @devops |
| Backend Lead | EHARA, LITHIRA | [Phone] | @backend |
| Database Admin | [Name] | [Phone] | @dba |

---

## Deployment History

| Date | Version | Environment | Status | Notes |
|------|---------|-------------|--------|-------|
| 2026-04-12 | 1.0.0 | Staging | ✅ Success | Initial Playwright migration |
| TBD | 1.0.1 | Production | Pending | After staging validation |

---

## Additional Resources

- **Testing Documentation**: `TEST_SUITE_DOCUMENTATION.md`
- **API Documentation**: `backend/README.md`
- **Frontend Guide**: `frontend/QUICKSTART.md`
- **Architecture Diagram**: `ARCHITECTURE.md`
- **Troubleshooting Guide**: `TROUBLESHOOTING.md`

---

**Last Updated**: April 12, 2026  
**Maintained By**: Development Team (EHARA, LITHIRA, VAGEESHA, KUSAL)  
**Review Frequency**: Every 2 weeks or after major deployment

For questions or updates, contact the Development Team via Slack or project repository.
