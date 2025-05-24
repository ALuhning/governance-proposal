// Enhanced test script for the new array parsing functions
console.log('Testing enhanced array parsing functions');

// Since we're running this directly, we'll reimplement our parsing functions here
// Based on the functions in arrayUtils.ts
function parseBracketedArray(text) {
  try {
    // Basic validation
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // If it's not wrapped in brackets, split by commas
    const trimmed = text.trim();
    if (!trimmed.startsWith('[') && !trimmed.endsWith(']')) {
      return trimmed.split(',').map(item => item.trim()).filter(Boolean);
    }
    
    // Extract the content between the outer brackets
    const bracketMatch = trimmed.match(/^\s*\[(.*)\]\s*$/);
    if (!bracketMatch || !bracketMatch[1]) {
      return [trimmed]; // Return the whole string if no bracket match
    }
    
    // Split by commas that are not inside quotes or brackets
    const items = [];
    let current = '';
    let inQuotes = false;
    let bracketDepth = 0;
    
    // Process character by character
    for (let i = 0; i < bracketMatch[1].length; i++) {
      const char = bracketMatch[1][i];
      
      // Track quotes
      if ((char === "'" || char === '"') && 
          (i === 0 || bracketMatch[1][i-1] !== '\\')) {
        inQuotes = !inQuotes;
      }
      // Track brackets
      else if (char === '[' && !inQuotes) {
        bracketDepth++;
      }
      else if (char === ']' && !inQuotes) {
        bracketDepth--;
      }
      // Handle commas
      else if (char === ',' && !inQuotes && bracketDepth === 0) {
        items.push(current.trim());
        current = '';
        continue;
      }
      
      current += char;
    }
    
    // Add the last item
    if (current.trim()) {
      items.push(current.trim());
    }
    
    // Clean up each item
    return items
      .map(item => item.replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
      .filter(Boolean); // Remove empty items
      
  } catch (error) {
    console.error('Array parsing error:', error);
    return [];
  }
}

function safeArrayParse(text) {
  // Strategy 1: Standard JSON parse
  try {
    const cleanedText = text
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/,\s*\]/g, ']')  // Remove trailing commas
      .replace(/"\s*([^"]+)"\s*"([^"]+)"/g, '"$1", "$2"'); // Fix missing commas
    
    const parsed = JSON.parse(cleanedText);
    if (Array.isArray(parsed)) {
      return parsed.map(item => String(item));
    }
  } catch (_) {
    // Continue to next strategy
  }
  
  // Strategy 2: Handle arrays with brackets in content
  try {
    return parseBracketedArray(text);
  } catch (_) {
    // Continue to next strategy
  }
  
  // Strategy 3: Simple comma splitting
  try {
    return text
      .replace(/^\[|\]$/g, '') // Remove outer brackets
      .split(',')
      .map(item => item.replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
      .filter(Boolean);
  } catch (_) {
    // Continue to final fallback
  }
  
  // Final fallback: return as a single item
  return text ? [text.trim()] : [];
}

// Test cases
const testCases = [
  // Regular array
  "['item1', 'item2', 'item3']",
  
  // Array with brackets in content (problem case)
  "['[Link to community discussion on content creator rewards]', '[Link to research on content creator incentivization]', '[Link to NEAR Protocol treasury management guidelines]']",
  
  // Malformed array with missing commas
  "['item1' 'item2' 'item3']",
  
  // Array with nested brackets
  "['[item1]', '[item2, subitem]']"
];

// Original simple parsing function (for comparison)
function simpleParse(text) {
  // Remove outer brackets
  const content = text.slice(1, -1);
  
  // Handle bracketed content by analyzing character by character
  const items = [];
  let current = '';
  let inQuotes = false;
  let bracketDepth = 0;
  
  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    
    // Track quotes
    if ((char === "'" || char === '"') && 
        (i === 0 || content[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    }
    // Track brackets
    else if (char === '[' && !inQuotes) {
      bracketDepth++;
    }
    else if (char === ']' && !inQuotes) {
      bracketDepth--;
    }
    // Handle commas
    else if (char === ',' && !inQuotes && bracketDepth === 0) {
      items.push(current.trim());
      current = '';
      continue;
    }
    
    current += char;
  }
  
  // Add the last item
  if (current.trim()) {
    items.push(current.trim());
  }
  
  // Clean up each item
  return items.map(item => item.replace(/^['"]|['"]$/g, '').trim());
}

// Enhanced function to parse references (simplified version of the TS implementation)
function parseReferences(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  console.log("Parsing references text:", text);
  
  // Case 1: Numbered list with brackets separated by newlines
  if (text.includes('\n') && /\d+\.\s*\[/.test(text)) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map((line, index) => {
        // If it already has the proper numbered format, use it as is
        if (/^\d+\.\s*\[.*\]$/.test(line.trim())) {
          return line.trim();
        } 
        // If it has brackets but no number, add the number
        else if (/^\[.*\]$/.test(line.trim())) {
          return `${index + 1}. ${line.trim()}`;
        }
        // If it has no brackets, add both number and brackets
        else {
          return `${index + 1}. [${line.trim()}]`;
        }
      });
  }
  
  // Case 2: Single numbered item with brackets
  if (/^\d+\.\s*\[/.test(text.trim())) {
    return [text.trim()];
  }
  
  // Case 3: Array of bracketed items
  try {
    if ((text.includes('["[') || text.includes("['[")) && 
        (text.includes(']"]') || text.includes("]']"))) {
      const parsed = JSON.parse(
        text.replace(/'/g, '"')
           .replace(/",\s*"/g, '", "')
      );
      
      return parsed.map((item, index) => {
        const trimmed = item.trim();
        if (/^\[.*\]$/.test(trimmed)) {
          return `${index + 1}. ${trimmed}`;
        } else if (!trimmed.includes('[') && !trimmed.includes(']')) {
          return `${index + 1}. [${trimmed}]`;
        }
        return trimmed;
      });
    }
  } catch (e) {
    console.log("Failed to parse bracketed array:", e);
  }

  // Case 4: Newline separated items without numbers
  if (text.includes('\n')) {
    if (text.split('\n').some(line => /^\[.*\]$/.test(line.trim()))) {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => {
          if (/^\[.*\]$/.test(line)) {
            return `${index + 1}. ${line}`;
          } else if (!line.includes('[') && !line.includes(']')) {
            return `${index + 1}. [${line}]`;
          }
          return line;
        });
    }
  }
  
  // Case 5: Single bracketed item
  if (/^\[.*\]$/.test(text.trim())) {
    return [`1. ${text.trim()}`];
  }
  
  // Case 6: Single line without brackets
  if (!text.includes('[') && !text.includes(']') && !text.includes('\n')) {
    return [`1. [${text.trim()}]`];
  }
  
  // Fall back to standard array parsing
  const parsedItems = safeArrayParse(text);
  
  // Format the parsed items to ensure consistent numbering
  return parsedItems.map((item, index) => {
    const trimmed = item.trim();
    
    if (/^\d+\.\s*\[.*\]$/.test(trimmed)) {
      return trimmed;
    } else if (/^\[.*\]$/.test(trimmed)) {
      return `${index + 1}. ${trimmed}`;
    } else {
      return `${index + 1}. [${trimmed}]`;
    }
  });
}

// Reference test cases
const referenceTestCases = [
  // Single numbered reference
  "1. [Link to community discussion]",
  
  // Multiple numbered references
  "1. [Link to community discussion]\n2. [Research paper on governance]",
  
  // Single bracketed item
  "[Link to community discussion]",
  
  // Newline separated bracketed items
  "[Link to discussion]\n[Research paper]",
  
  // Plain text reference
  "Link to community discussion",
  
  // Mixed format
  "1. [First link]\n[Second link]\nThird link"
];

// Run tests for each case
console.log('=== Array Parser Test Results ===');
testCases.forEach((test, index) => {
  console.log(`\nTest case ${index + 1}:`);
  console.log(`Input: ${test}`);
  
  console.log('Original parser result:');
  const originalResult = simpleParse(test);
  originalResult.forEach((item, i) => {
    console.log(`  ${i+1}: "${item}"`);
  });
  
  console.log('New safeArrayParse result:');
  const newResult = safeArrayParse(test);
  newResult.forEach((item, i) => {
    console.log(`  ${i+1}: "${item}"`);
  });
  
  console.log('parseBracketedArray result:');
  const bracketResult = parseBracketedArray(test);
  bracketResult.forEach((item, i) => {
    console.log(`  ${i+1}: "${item}"`);
  });
});

console.log('\n\n=== Reference Parser Test Results ===');
referenceTestCases.forEach((test, index) => {
  console.log(`\nReference Test case ${index + 1}:`);
  console.log(`Input: ${test}`);
  
  console.log('parseReferences result:');
  const refResult = parseReferences(test);
  refResult.forEach((item, i) => {
    console.log(`  ${i+1}: "${item}"`);
  });
});
