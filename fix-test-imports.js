/**
 * Fix all test imports
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

  // Check if test is already imported
  if (!content.includes("const { test,") && !content.includes("const { test }")) {
    // Add import at the top after other imports
    const lines = content.split('\n');
    let insertIndex = 0;
    
    // Find the last require/import line
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('require(') || lines[i].includes('import')) {
        insertIndex = i + 1;
      } else if (lines[i].trim() === '' && insertIndex > 0) {
        break;
      }
    }

    // Insert test import
    lines.splice(insertIndex, 0, "const { test } = require('@playwright/test');");
    content = lines.join('\n');
  }

  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Fixed imports: ${file}`);
});

console.log('\n✨ All imports fixed!');
