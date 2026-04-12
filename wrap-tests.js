/**
 * Proper Playwright Migration
 * Wraps existing test functions with Playwright test() syntax
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
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

testFiles.forEach(file => {
  const fullPath = path.join(__dirname, file);
  if (!fs.existsSync(fullPath)) return;

  let content = fs.readFileSync(fullPath, 'utf8');

  // Check if already migrated
  if (content.includes('test(')) return;

  // Find the main test function name
  const functionMatch = content.match(/async function (run\w+Tests)\(\)/);
  if (!functionMatch) {
    console.log(`⚠️  Could not find test function pattern in: ${file}`);
    return;
  }

  const funcName = functionMatch[1];
  
  // Find existing describe block if any
  const describeMatch = content.match(/test\.describe\(|describe\(/);
  
  if (describeMatch) {
    // Replace describe block with test wrapper
    content = content.replace(
      /test\.describe\([^\)]*,\s*\(\)\s*=>\s*\{[^}]*await\s+(\w+Tests)\(\);[^}]*\}\);?/s,
      `test('${funcName}', async () => { await $1(); });`
    );

    content = content.replace(
      /describe\([^\)]*,\s*\(\)\s*=>\s*\{[^}]*await\s+(\w+Tests)\(\);[^}]*\}\);?/s,
      `test('${funcName}', async () => { await $1(); });`
    );
  } else {
    // Add test wrapper at end if no describe block exists
    content = content + `\n\ntest('${funcName}', async () => { \n  await ${funcName}(); \n});\n`;
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Wrapped: ${file}`);
});

console.log('\n✨ All tests wrapped with Playwright!');
