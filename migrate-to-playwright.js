/**
 * Playwright Migration Script
 * Converts all test files from Node assert to Playwright test format
 */

const fs = require('fs');
const path = require('path');

const testFilesPattern = [
  'tests/unit/component1-storyLibrary/storyService.unit.spec.js',
  'tests/integration/component1-storyLibrary/storyLibrary.integration.spec.js',
  'tests/system/component1-storyLibrary/storyLibrary.system.spec.js',
  'tests/unit/component2-familyAndAssignment/familyAssignment.unit.spec.js',
  'tests/integration/component2-familyAndAssignment/familyAssignmentChat.integration.spec.js',
  'tests/system/component2-familyAndAssignment/familySystem.system.spec.js',
  'tests/unit/component3-readingAnalytics/readingProgress.unit.spec.js',
  'tests/integration/component3-readingAnalytics/readingAnalytics.integration.spec.js',
  'tests/system/component3-readingAnalytics/readingAnalytics.system.spec.js',
  'tests/unit/component4-gamification/gamification.unit.spec.js',
  'tests/integration/component4-gamification/gamification.integration.spec.js',
  'tests/system/component4-gamification/gamification.system.spec.js',
];

function migrateFile(filePath) {
  const fullPath = path.join(__dirname, filePath);
  
  if (!fs.existsSync(fullPath)) {
    console.log(`❌ File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');

  // Replace imports
  content = content.replace(
    /const assert = require\("assert"\);/g,
    'const { test, expect } = require(\'@playwright/test\');'
  );

  content = content.replace(
    /const \{ TestReport, assert[^}]* \} = require\("\.\.\/\.\.\/config\/test-utils"\);/g,
    'const { TestReport } = require(\'../../config/test-utils\');'
  );

  // Replace describe blocks with test blocks
  content = content.replace(
    /describe\("([^"]+)",\s*\(\)\s*=>\s*\{/g,
    'test.describe(\'$1\', () => {'
  );

  // Replace it blocks with test blocks
  content = content.replace(
    /it\("([^"]+)",\s*async\s*\(\)\s*=>\s*\{/g,
    'test(\'$1\', async () => {'
  );

  content = content.replace(
    /it\("([^"]+)",\s*\(\)\s*=>\s*\{/g,
    'test(\'$1\', () => {'
  );

  // Replace assert.strictEqual with expect
  content = content.replace(
    /assert\.strictEqual\(([^,]+),\s*([^,]+),\s*"([^"]+)"\)/g,
    'expect($1).toBe($2);'
  );

  content = content.replace(
    /assert\.strictEqual\(([^,]+),\s*([^)]+)\)/g,
    'expect($1).toBe($2);'
  );

  // Replace assert.ok
  content = content.replace(
    /assert\.ok\(([^,]+),\s*"([^"]+)"\)/g,
    'expect(!!$1).toBe(true);'
  );

  // Replace assert.deepStrictEqual with expect
  content = content.replace(
    /assert\.deepStrictEqual\(([^,]+),\s*([^)]+)\)/g,
    'expect($1).toEqual($2);'
  );

  // Replace assert.throws - this needs special handling
  content = content.replace(
    /assert\.throws\(\(\)\s*=>\s*\{([^}]+)\},\s*\/([^\/]+)\/\)/g,
    'expect(() => {$1}).toThrow(/$2/);'
  );

  // Replace common patterns with expect
  content = content.replace(/assert\.fail/g, 'throw new Error');

  // Save the file
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Migrated: ${filePath}`);
}

// Migrate all files
console.log('🚀 Starting Playwright migration...\n');
testFilesPattern.forEach(migrateFile);
console.log('\n✨ Migration complete!');
