// Test script for reference parser fixes
import { parseReferences } from './arrayUtils';

// Test various reference formats
const testCases = [
  {
    name: "Single numbered reference",
    input: "1. [Link to community discussion]",
    expected: "Should maintain number and brackets"
  },
  {
    name: "Multiple numbered references",
    input: `1. [Link to community discussion]
2. [Research paper on governance]`,
    expected: "Should maintain numbers and brackets"
  },
  {
    name: "JSON array of bracketed items",
    input: '["[Link to community discussion]", "[Research paper]"]',
    expected: "Should add numbers to each bracketed item"
  },
  {
    name: "Newline separated bracketed items",
    input: `[Link to discussion]
[Research paper]`,
    expected: "Should add numbers to each bracketed item"
  },
  {
    name: "Mixed format items",
    input: `1. [Link to discussion]
[Research paper]
Just a plain text reference`,
    expected: "Should normalize all to numbered bracketed format"
  },
  {
    name: "Single non-bracketed item",
    input: "Link to community discussion",
    expected: "Should add number and brackets"
  },
  {
    name: "Edge case with inconsistent numbering",
    input: `1. [First reference]
5. [Second reference]
10. [Third reference]`,
    expected: "Should normalize numbering (1, 2, 3)"
  },
  {
    name: "Empty input",
    input: "",
    expected: "Should handle empty input gracefully"
  }
];

// Run the tests
console.log("REFERENCE PARSER TEST RESULTS:\n");

testCases.forEach((test, i) => {
  console.log(`TEST ${i + 1}: ${test.name}`);
  console.log(`Input: ${test.input}`);
  
  try {
    const result = parseReferences(test.input);
    console.log(`Output:`, result);
    
    if (result.length > 0) {
      console.log(`First item format check: ${/^\d+\.\s*\[.*\]$/.test(result[0]) ? 'PASS' : 'FAIL'}`);
      
      // Check for sequential numbering
      if (result.length > 1) {
        const hasSequentialNumbers = result.every((item, idx) => {
          const match = item.match(/^(\d+)\./);
          return match && parseInt(match[1]) === idx + 1;
        });
        console.log(`Sequential numbering check: ${hasSequentialNumbers ? 'PASS' : 'FAIL'}`);
      }
    } else {
      console.log("No items returned");
    }
    
    console.log(`Expected: ${test.expected}`);
  } catch (err) {
    console.error(`Error: ${err}`);
  }
  
  console.log("\n---\n");
});

console.log("Test complete");
