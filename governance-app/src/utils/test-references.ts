// Test file for references parsing
import { parseReferences, safeArrayParse } from './arrayUtils';

// Format 1: Numbered list with brackets
const testText1 = `1. [Link to community discussion on content creation incentives]
2. [Research paper on governance mechanisms]`;

// Format 2: Array with bracketed items
const testText2 = `["[Link to community discussion]", "[Research paper]"]`;

// Format 3: Simple bracketed items
const testText3 = `[Link to community discussion]`;

// Format 4: Newline separated items without numbers
const testText4 = `[Link to discussion]
[Research paper]`;

console.log("Test 1 - Numbered list:");
console.log(parseReferences(testText1));

console.log("\nTest 2 - Array with bracketed items:");
console.log(parseReferences(testText2));

console.log("\nTest 3 - Simple bracketed item:");
console.log(parseReferences(testText3));

console.log("\nTest 4 - Newline separated:");
console.log(parseReferences(testText4));

// Testing safeArrayParse for comparison
console.log("\nsafeArrayParse Test 1:");
console.log(safeArrayParse(testText1));

console.log("\nsafeArrayParse Test 3:");
console.log(safeArrayParse(testText3));
