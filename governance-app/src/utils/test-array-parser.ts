// Test file for array parsing functions

import { safeArrayParse } from './arrayUtils';

// Sample data from the error case
const testCases = [
  // Regular array
  `['item1', 'item2', 'item3']`,
  
  // Array with brackets in content (problem case)
  `['[Link to community discussion on content creator rewards]', '[Link to research on content creator incentivization]', '[Link to NEAR Protocol treasury management guidelines]']`,
  
  // Malformed array with missing commas
  `['item1' 'item2' 'item3']`,
  
  // Array with nested brackets
  `['[item1]', '[item2, subitem]']`
];

// Print results
console.log('=== Array parsing test results ===');
testCases.forEach((test, index) => {
  console.log(`\nTest case ${index + 1}:`);
  console.log(`Input: ${test}`);
  try {
    const result = safeArrayParse(test);
    console.log(`Output (${result.length} items):`);
    result.forEach((item, i) => {
      console.log(`  ${i+1}: "${item}"`);
    });
  } catch (error) {
    console.error(`Error: ${error}`);
  }
});
