/**
 * Fix Playwright imports - remove duplicate expect
 */

const fs = require('fs');
const path = require('path');

const testFiles = [
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
  
  // Remove duplicate expect import
  content = content.replace(
    /const \{ TestReport, expect \}/g,
    'const { TestReport }'
  );

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Fixed: ${file}`);
});

console.log('\n✨ All imports fixed!');
