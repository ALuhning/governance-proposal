/**
 * Specialized utilities to handle array parsing with nested brackets and special formats
 */

/**
 * Parses arrays with potential nested brackets (e.g., links in references)
 * This function specifically handles cases like:
 * ['[Link to community discussion on content creator rewards]', '[Link to research...]']
 * 
 * @param text - The text to parse as an array
 * @returns A properly parsed string array
 */
export const parseBracketedArray = (text: string): string[] => {
  try {
    // Handle non-array input
    if (!text || typeof text !== 'string') {
      return [];
    }
    
    // If it looks like a numbered list with square brackets (common for references)
    // Example: "1. [Link to community discussion on content creation incentives]"
    if (/^\d+\.\s*\[.*\]/.test(text.trim())) {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);
    }
    
    // If it's not wrapped in brackets, split by commas or newlines
    const trimmed = text.trim();
    if (!trimmed.startsWith('[') && !trimmed.endsWith(']')) {
      // Check if it has newlines (common in references)
      if (trimmed.includes('\n')) {
        return trimmed.split('\n').map(item => item.trim()).filter(Boolean);
      }
      return trimmed.split(',').map(item => item.trim()).filter(Boolean);
    }
    
    // Extract the content between the outer brackets
    const bracketMatch = trimmed.match(/^\s*\[(.*)\]\s*$/s); // Using 's' flag for multiline
    if (!bracketMatch || !bracketMatch[1]) {
      return [trimmed]; // Return the whole string if no bracket match
    }
    
    // Split by commas that are not inside quotes or brackets
    const items: string[] = [];
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
};

/**
 * Specialized function to parse references in various formats
 * 
 * @param text - The text containing references
 * @returns An array of properly formatted references
 */
export const parseReferences = (text: string): string[] => {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  console.log("Parsing references text:", text);
  
  // Case 1: Numbered list with brackets separated by newlines
  // Example: "1. [Link to community discussion]\n2. [Another link]"
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
  // Example: "1. [Link to community discussion]"
  if (/^\d+\.\s*\[/.test(text.trim())) {
    return [text.trim()];
  }
  
  // Case 3: Array of bracketed items
  // Example: ["[Link to community discussion]", "[Another link]"]
  try {
    if ((text.includes('["[') || text.includes("['[")) && 
        (text.includes(']"]') || text.includes("]']"))) {
      const parsed = JSON.parse(
        text.replace(/'/g, '"')
           .replace(/",\s*"/g, '", "') // Fix spacing issues
      );
      
      // Format items with numbers
      return parsed.map((item: string, index: number) => {
        const trimmed = item.trim();
        // If it has brackets but no number, add the number
        if (/^\[.*\]$/.test(trimmed)) {
          return `${index + 1}. ${trimmed}`;
        }
        // If it has no brackets, add both number and brackets
        else if (!trimmed.includes('[') && !trimmed.includes(']')) {
          return `${index + 1}. [${trimmed}]`;
        }
        return trimmed;
      });
    }
  } catch (e) {
    console.log("Failed to parse bracketed array:", e);
  }

  // Case 4: Newline separated items without numbers
  // Example: "[Link to discussion]\n[Research paper]"
  if (text.includes('\n')) {
    if (text.split('\n').some(line => /^\[.*\]$/.test(line.trim()))) {
      return text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => {
          // If it has brackets but no number, add the number
          if (/^\[.*\]$/.test(line)) {
            return `${index + 1}. ${line}`;
          }
          // If it has no brackets, add both number and brackets
          else if (!line.includes('[') && !line.includes(']')) {
            return `${index + 1}. [${line}]`;
          }
          return line;
        });
    }
  }
  
  // Case 5: Single bracketed item
  // Example: "[Link to community discussion]"
  if (/^\[.*\]$/.test(text.trim())) {
    return [`1. ${text.trim()}`];
  }
  
  // Case 6: Single line without brackets
  // Example: "Link to community discussion"
  if (!text.includes('[') && !text.includes(']') && !text.includes('\n')) {
    return [`1. [${text.trim()}]`];
  }
  
  // Fall back to standard array parsing
  const parsedItems = safeArrayParse(text);
  
  // Format the parsed items to ensure consistent numbering
  return parsedItems.map((item, index) => {
    const trimmed = item.trim();
    
    // If it already has the proper numbered format, use it as is
    if (/^\d+\.\s*\[.*\]$/.test(trimmed)) {
      return trimmed;
    }
    // If it has brackets but no number, add the number
    else if (/^\[.*\]$/.test(trimmed)) {
      return `${index + 1}. ${trimmed}`;
    }
    // If it has no brackets, add both number and brackets
    else {
      return `${index + 1}. [${trimmed}]`;
    }
  });
};

/**
 * Enhanced safe array parsing function with multiple strategies
 * Tries different approaches to convert string to array
 * 
 * @param text - The text to parse as an array
 * @returns A properly parsed string array
 */
export const safeArrayParse = (text: string): string[] => {
  // Check for numbered list with brackets format first (common for references)
  // Example: "1. [Link to community discussion on content creation incentives]"
  const numberedBracketPattern = /^\d+\.\s*\[.*\]/;
  console.log("Checking for numbered brackets pattern in:", text);
  
  if (text.includes('\n')) {
    const lines = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    console.log("Split into lines:", lines);
      
    // Check if any line matches the numbered bracket pattern
    if (lines.some(line => numberedBracketPattern.test(line))) {
      console.log("Found numbered list with brackets format in references");
      return lines;
    }
  } else if (numberedBracketPattern.test(text.trim())) {
    console.log("Found single numbered bracketed reference");
    return [text.trim()];
  }
  
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
  } catch {
    // Continue to next strategy
  }
  
  // Strategy 2: Handle arrays with brackets in content
  try {
    return parseBracketedArray(text);
  } catch {
    // Continue to next strategy
  }
  
  // Strategy 3: Check for newline separated items
  if (text.includes('\n')) {
    try {
      return text
        .replace(/^\[|\]$/g, '') // Remove outer brackets if present
        .split('\n')
        .map(item => item.replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
        .filter(Boolean);
    } catch {
      // Continue to next strategy
    }
  }
  
  // Strategy 4: Simple comma splitting
  try {
    return text
      .replace(/^\[|\]$/g, '') // Remove outer brackets
      .split(',')
      .map(item => item.replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
      .filter(Boolean);
  } catch {
    // Continue to final fallback
  }
  
  // Final fallback: return as a single item
  return text ? [text.trim()] : [];
};
