// filepath: /home/vitalpointai/projects/governance_proposal_agent/governance-app/src/utils/proposalUtils.ts
// Import from the new types file
import type { ProposalData } from '../types/proposalTypes';
import { safeArrayParse } from './arrayUtils';

/**
 * Helper function to safely parse potential JSON arrays from the response
 * @param text - The text that might contain a JSON array
 * @returns The parsed array or an empty array if parsing fails
 * @deprecated Use safeArrayParse or parseBracketedArray from arrayUtils.ts instead
 */
const safelyParseArray = (text: string): string[] => {
  try {
    // Check if this looks like an array
    if (!text.trim().startsWith('[')) {
      return text.split(',').map(item => item.trim());
    }
    
    // Fix common JSON array issues
    const cleanedText = text
      .replace(/'/g, '"')  // Replace single quotes with double quotes
      .replace(/,\s*\]/g, ']')  // Remove trailing commas
      .replace(/"\s*([^"]+)"\s*"([^"]+)"/g, '"$1", "$2"'); // Fix missing commas between items
    
    // Try to parse it as JSON first
    try {
      return JSON.parse(cleanedText);
    } catch (e) {
      // Continue with other parsing strategies if JSON parse fails
      console.log("JSON parse failed, trying other methods:", e);
    }

    // Special handling for arrays with square brackets in the content (like '[Link text]')
    // This is common in references sections
    const linkBracketPattern = /\['([^\]]+)'\]/g;
    const hasLinkBrackets = linkBracketPattern.test(text);
    
    if (hasLinkBrackets) {
      // Extract content between outer square brackets, but preserve inner brackets
      const bracketMatch = text.match(/^\s*\[(.*)\]\s*$/);
      if (bracketMatch && bracketMatch[1]) {
        // Split by commas that are not inside quotes or brackets
        const items: string[] = [];
        let current = '';
        let inQuotes = false;
        let bracketDepth = 0;
        
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
        return items.map(item => 
          item.replace(/^['"]|['"]$/g, '') // Remove surrounding quotes
            .trim()
        );
      }
    }
    
    // Standard array parsing for formats like ['item1','item2','item3']
    const matches = text.match(/\[([^\]]+)\]/);
    if (matches && matches[1]) {
      // Split by comma, handling quoted strings properly
      const items = [];
      let currentItem = '';
      let inQuotes = false;
      
      for (let i = 0; i < matches[1].length; i++) {
        const char = matches[1][i];
        
        if ((char === "'" || char === '"') && 
            (i === 0 || matches[1][i-1] !== '\\')) {
          inQuotes = !inQuotes;
          if (!inQuotes && currentItem.length > 0) {
            // End of an item
            items.push(currentItem);
            currentItem = '';
          }
        } else if (char === ',' && !inQuotes) {
          // Skip commas between items
        } else if (inQuotes) {
          currentItem += char;
        }
      }
      
      // Handle the last item
      if (currentItem.length > 0) {
        items.push(currentItem);
      }
      
      return items.filter(Boolean);
    }
    
    // If all else fails, split by commas
    return text
      .replace(/^\[|\]$/g, '') // Remove [ and ] if present
      .split(',')
      .map(item => item.replace(/^['"]|['"]$/g, '').trim()) // Remove quotes
      .filter(Boolean);
  } catch (error) {
    console.error('Array parsing completely failed:', error);
    // Return a single item containing the text as a last resort
    return [text.replace(/^\[|\]$/g, '').trim()];
  }
};

/**
 * Parses the response string from the Langflow API to a structured proposal object
 * @param responseText - The text response from Langflow API
 * @returns Parsed proposal data object
 */
export const parseProposalResponse = async (responseText: string): Promise<ProposalData> => {
  try {
    console.log("Raw response:", responseText);
    
    // Initial empty proposal object with default values
    const parsedProposal: ProposalData = {
      proposal_title: '',
      proposal_summary: '',
      problem: '',
      solution: [],
      milestones: [],
      outcomes: [],
      stakeholder_impact: [],
      resources: [],
      risks: [],
      alternatives: [],
      implementation: [],
      metrics: [],
      references: []
    };
    
    // Try different parsing strategies based on the response format
    
    // Based on the console logs, we're seeing a string that looks like this:
    // 'proposal_title':'Content Creator Rewards Program','proposal_summary':'...',...
    // It's not valid JSON as the keys aren't properly quoted
    
    // Strategy 1: Fix the most common pattern we're seeing in the response format
    if (responseText.includes("'proposal_title'") && !responseText.startsWith("{")) {
      try {
        console.log("Using direct field extraction strategy");
        
        // Extract key fields directly using regex
        const titleMatch = responseText.match(/'proposal_title'\s*:\s*'([^']+)'/);
        const summaryMatch = responseText.match(/'proposal_summary'\s*:\s*'([^']+)'/);
        const problemMatch = responseText.match(/'problem'\s*:\s*'([^']+)'/);
        
        // Extract the array-based fields with improved regex
        const extractArray = (fieldName: string) => {
          // Try multiple regex patterns to match different array formats
          
          // Format 1: 'fieldname':['item1','item2',...]
          const arrayMatch1 = responseText.match(new RegExp(`'${fieldName}'\\s*:\\s*\\[([^\\]]+)\\]`));
          
          // Format 2: fieldname: ["item1", "item2", ...] (double quotes)
          const arrayMatch2 = responseText.match(new RegExp(`${fieldName}\\s*:\\s*\\[([^\\]]+)\\]`));
          
          // Format 3: Look for bulleted lists like: fieldname: - item1 - item2
          const arrayMatch3 = responseText.match(new RegExp(`${fieldName}\\s*:(?:\\s*|\\n+)((?:\\s*-\\s*[^\\n]+\\n*)+)`));
          
          let extractedItems: string[] = [];
          
          if (arrayMatch1 && arrayMatch1[1]) {
            // Special handling for references fields with bracketed links
            if (fieldName === 'references') {
              const bracketContent = arrayMatch1[1];
              console.log(`Parsing references array with special handler: [${bracketContent}]`);
              extractedItems = safeArrayParse(`[${bracketContent}]`);
              console.log("Parsed references:", extractedItems);
            } else {
              // Parse using our specialized function for arrays
              extractedItems = safeArrayParse(`[${arrayMatch1[1]}]`);
            }
          } else if (arrayMatch2 && arrayMatch2[1]) {
            // Special handling for references fields with bracketed links
            if (fieldName === 'references') {
              extractedItems = safeArrayParse(`[${arrayMatch2[1]}]`);
            } else {
              extractedItems = safeArrayParse(`[${arrayMatch2[1]}]`);
            }
          } else if (arrayMatch3 && arrayMatch3[1]) {
            extractedItems = arrayMatch3[1]
              .split('-')
              .map(item => item.trim())
              .filter(Boolean);
          } else {
            // Fallback: look for any section that might contain the data
            const fallbackMatch = responseText.match(
              new RegExp(`${fieldName}(?:\\s*|\\n+):(?:\\s*|\\n+)([^\\n]*)`, 'i')
            );
            
            if (fallbackMatch && fallbackMatch[1]) {
              // If it looks like an array, try to parse it using our specialized function
              const trimmed = fallbackMatch[1].trim();
              if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                extractedItems = safeArrayParse(trimmed);
              } else {
                // Otherwise use it as a single item
                extractedItems = [trimmed];
              }
            }
          }
          
          return extractedItems.filter(item => item.trim().length > 0);
        };
        
        if (titleMatch && titleMatch[1]) parsedProposal.proposal_title = titleMatch[1];
        if (summaryMatch && summaryMatch[1]) parsedProposal.proposal_summary = summaryMatch[1];
        if (problemMatch && problemMatch[1]) parsedProposal.problem = problemMatch[1];
        
        parsedProposal.solution = extractArray('solution');
        parsedProposal.milestones = extractArray('milestones');
        parsedProposal.outcomes = extractArray('outcomes');
        parsedProposal.stakeholder_impact = extractArray('stakeholder_impact');
        parsedProposal.resources = extractArray('resources');
        parsedProposal.risks = extractArray('risks');
        parsedProposal.alternatives = extractArray('alternatives');
        parsedProposal.implementation = extractArray('implementation');
        parsedProposal.metrics = extractArray('metrics');
        
        // Use special handling for references section with bracketed links
        const { parseReferences } = await import('./arrayUtils');
        
        // Try various patterns to extract references
        const referencesMatch1 = responseText.match(/'references'\s*:\s*\[(.*?)\]/s);
        const referencesMatch2 = responseText.match(/references\s*:\s*\[(.*?)\]/s);
        const referencesMatch3 = responseText.match(/references\s*:\s*(\d+\.\s*\[.*?\].*?)(?:\n\n|\n[a-z]|$)/is);
        
        if (referencesMatch1 && referencesMatch1[1]) {
          parsedProposal.references = parseReferences(`[${referencesMatch1[1]}]`);
          console.log("References parsed from pattern 1:", parsedProposal.references);
        } else if (referencesMatch2 && referencesMatch2[1]) {
          parsedProposal.references = parseReferences(`[${referencesMatch2[1]}]`);
          console.log("References parsed from pattern 2:", parsedProposal.references);
        } else if (referencesMatch3 && referencesMatch3[1]) {
          parsedProposal.references = parseReferences(referencesMatch3[1]);
          console.log("References parsed from pattern 3:", parsedProposal.references);
        } else {
          parsedProposal.references = extractArray('references');
          console.log("References parsed from generic extractor:", parsedProposal.references);
        }
        
        console.log("Direct extraction results:", parsedProposal);
        
        // If we've successfully extracted at least some fields, return the result
        if (parsedProposal.proposal_title || parsedProposal.proposal_summary) {
          return parsedProposal;
        }
      } catch (directError) {
        console.error("Error with direct field extraction:", directError);
      }
    }
    
    // Strategy 2: Try parsing as a complete JSON object 
    try {
      // Handle common JSON formatting issues with more robust regex
      let cleanedText = responseText
        .replace(/'/g, '"')          // Replace all single quotes with double quotes
        .replace(/(\w+):/g, '"$1":') // Ensure property names are quoted
        .replace(/,\s*}/g, '}')      // Remove trailing commas
        .replace(/:\s*"([^"]*)"(\s*[,}])/g, ': "$1"$2'); // Ensure string values are double-quoted
      
      // Fix invalid array formats - common cause of JSON parsing errors
      // Replace things like: "array": ["item1" "item2"] (missing comma)
      cleanedText = cleanedText.replace(/"\s*([^"]+)"\s*"([^"]+)"/g, '"$1", "$2"');
      
      // Fix cases where there are extra characters in arrays
      cleanedText = cleanedText.replace(/\[\s*([^[\]]*?)\s*\]/g, (match, content) => {
        // Split by commas but preserve quoted strings
        const items = [];
        let currentItem = '';
        let inQuotes = false;
        
        // Process the array content character by character
        for (let i = 0; i < content.length; i++) {
          const char = content[i];
          
          if (char === '"') {
            inQuotes = !inQuotes;
            currentItem += char;
          } else if (char === ',' && !inQuotes) {
            // End of an item
            items.push(currentItem.trim());
            currentItem = '';
          } else {
            currentItem += char;
          }
        }
        
        // Add the last item
        if (currentItem.trim()) {
          items.push(currentItem.trim());
        }
        
        // Join them back with proper commas
        return '[' + items.join(',') + ']';
      });
      
      const jsonText = responseText.startsWith("{") ? cleanedText : `{${cleanedText}}`;
      console.log("Attempting to parse cleaned JSON:", jsonText.substring(0, 100) + "...");
      
      const jsonResponse = JSON.parse(jsonText);
      console.log("Parsed as JSON:", jsonResponse);
      
      // Map json properties to our proposal structure
      Object.keys(jsonResponse).forEach(key => {
        const normalizedKey = key.toLowerCase().replace(/ /g, '_');
        if (normalizedKey in parsedProposal) {
          // Type-safe approach
          switch(normalizedKey) {
            case 'proposal_title':
              parsedProposal.proposal_title = String(jsonResponse[key]);
              break;
            case 'proposal_summary':
              parsedProposal.proposal_summary = String(jsonResponse[key]);
              break;
            case 'problem':
              parsedProposal.problem = String(jsonResponse[key]);
              break;
            case 'solution':
              parsedProposal.solution = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'milestones':
              parsedProposal.milestones = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'outcomes':
              parsedProposal.outcomes = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'stakeholder_impact':
              parsedProposal.stakeholder_impact = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'resources':
              parsedProposal.resources = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'risks':
              parsedProposal.risks = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'alternatives':
              parsedProposal.alternatives = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'implementation':
              parsedProposal.implementation = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'metrics':
              parsedProposal.metrics = Array.isArray(jsonResponse[key]) ? 
                jsonResponse[key].map(String) : [String(jsonResponse[key])];
              break;
            case 'references':
              // Special handling for references to ensure proper array parsing
              if (Array.isArray(jsonResponse[key])) {
                // If it's already an array, map to strings
                parsedProposal.references = jsonResponse[key].map(String);
              } else if (typeof jsonResponse[key] === 'string') {
                // If it's a string that might be a bracketed list
                const refString = String(jsonResponse[key]);
                if (refString.includes('[') && refString.includes(']')) {
                  // Likely a string representation of an array with bracketed contents
                  parsedProposal.references = safeArrayParse(refString);
                } else {
                  // Single reference as string
                  parsedProposal.references = [refString];
                }
              } else {
                // Fallback
                parsedProposal.references = [String(jsonResponse[key])];
              }
              break;
          }
        }
      });
      
      return parsedProposal;
    } catch (jsonError) {
      console.log("Failed to parse as JSON, trying alternative methods...", jsonError);
    }
    
    // Define a type for our sections to ensure type safety
    type SectionConfig = {
      key: keyof ProposalData;
      regex: RegExp;
    };
    
    // Strategy 3: Look for section patterns with regex
    const sections: SectionConfig[] = [
      { key: 'proposal_title', regex: /(?:title|proposal title):\s*([^\n]+)/i },
      { key: 'proposal_summary', regex: /(?:summary|proposal summary|executive summary):\s*([^\n]+)/i },
      { key: 'problem', regex: /(?:problem statement|problem|issue):\s*([^\n]+)/i },
      { key: 'solution', regex: /(?:solution|solutions|proposed solution):\s*\[([^\]]+)\]|(?:solution|solutions|proposed solution):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'milestones', regex: /(?:milestones|timeline):\s*\[([^\]]+)\]|(?:milestones|timeline):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'outcomes', regex: /(?:outcomes|expected outcomes|results):\s*\[([^\]]+)\]|(?:outcomes|expected outcomes|results):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'stakeholder_impact', regex: /(?:stakeholder impact|stakeholders|impact):\s*\[([^\]]+)\]|(?:stakeholder impact|stakeholders|impact):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'resources', regex: /(?:resources|required resources):\s*\[([^\]]+)\]|(?:resources|required resources):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'risks', regex: /(?:risks|challenges|potential risks):\s*\[([^\]]+)\]|(?:risks|challenges|potential risks):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'alternatives', regex: /(?:alternatives|alternative solutions|other approaches):\s*\[([^\]]+)\]|(?:alternatives|alternative solutions|other approaches):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'implementation', regex: /(?:implementation|implementation plan|execution):\s*\[([^\]]+)\]|(?:implementation|implementation plan|execution):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'metrics', regex: /(?:metrics|success metrics|kpis):\s*\[([^\]]+)\]|(?:metrics|success metrics|kpis):\s*\n((?:\s*-[^\n]+\n)+)/i },
      { key: 'references', regex: /(?:references|sources|citations):\s*\[([^\]]+)\]|(?:references|sources|citations):\s*\n((?:\s*-[^\n]+\n)+)/i },
    ];
    
    sections.forEach(section => {
      const match = responseText.match(section.regex);
      if (match) {
        const value = match[1] || match[2] || '';
        
        if (section.key === 'proposal_title' || section.key === 'proposal_summary' || section.key === 'problem') {
          // For string fields
          parsedProposal[section.key] = value.trim();
          console.log(`Found ${section.key}:`, value.trim());
        } else {
          // For array fields
          // Check if the value starts with bullet points
          if (value.includes('- ')) {
            const listItems = value.split('- ')
              .map(item => item.trim())
              .filter(item => item.length > 0);
            parsedProposal[section.key] = listItems;
          } else {
            // Otherwise try parsing as an array
            try {
              parsedProposal[section.key] = safelyParseArray(value);
            } catch {
              // If parsing fails, split by commas
              const listItems = value.split(',')
                .map(item => item.trim())
                .filter(item => item.length > 0);
              parsedProposal[section.key] = listItems;
            }
          }
          console.log(`Found ${section.key}:`, parsedProposal[section.key]);
        }
      }
    });
    
    // Strategy 4: If we still have empty sections, look for headings and extract content
    const sectionHeadings = [
      'Title', 'Summary', 'Problem Statement', 'Solutions', 'Milestones', 
      'Outcomes', 'Stakeholder Impact', 'Resources', 'Risks', 
      'Alternatives', 'Implementation', 'Metrics', 'References'
    ];
    
    // Find all headings in the text
    const headingPattern = new RegExp(`(${sectionHeadings.join('|')})\\s*:\\s*([\\s\\S]*?)(?=(?:${sectionHeadings.join('|')})\\s*:|$)`, 'gi');
    let match;
    
    while ((match = headingPattern.exec(responseText)) !== null) {
      const heading = match[1].toLowerCase();
      const content = match[2].trim();
      
      // Map heading to our keys using a type-safe approach
      let key: keyof ProposalData | null = null;
      
      if (heading.includes('title')) key = 'proposal_title';
      else if (heading.includes('summary')) key = 'proposal_summary';
      else if (heading.includes('problem')) key = 'problem';
      else if (heading.includes('solution')) key = 'solution';
      else if (heading.includes('milestone')) key = 'milestones';
      else if (heading.includes('outcome')) key = 'outcomes';
      else if (heading.includes('stakeholder') || heading.includes('impact')) key = 'stakeholder_impact';
      else if (heading.includes('resource')) key = 'resources';
      else if (heading.includes('risk')) key = 'risks';
      else if (heading.includes('alternative')) key = 'alternatives';
      else if (heading.includes('implementation')) key = 'implementation';
      else if (heading.includes('metric')) key = 'metrics';
      else if (heading.includes('reference')) key = 'references';
      
      if (key) {
        if (key === 'proposal_title' || key === 'proposal_summary' || key === 'problem') {
          if (!parsedProposal[key]) {
            parsedProposal[key] = content;
          }
        } else {
          // For array fields - we check the type first to ensure type safety
          if (Array.isArray(parsedProposal[key]) && parsedProposal[key].length === 0) {
            const items = content.split('\n')
              .map(line => line.replace(/^-\s*/, '').trim())
              .filter(line => line.length > 0);
            
            if (items.length > 0) {
              parsedProposal[key] = items;
            } else {
              parsedProposal[key] = [content];
            }
          }
        }
      }
    }
    
    // Strategy 5: Try to find section blocks in markdown/structured text format
    // This handles formats where sections are delimited by headings like "## Solution"
    const sectionBlockRegex = /#+\s*([\w\s]+)\s*\n([\s\S]*?)(?=#+\s*[\w\s]+|$)/g;
    let blockMatch;
    
    while ((blockMatch = sectionBlockRegex.exec(responseText)) !== null) {
      const heading = blockMatch[1].trim().toLowerCase();
      const content = blockMatch[2].trim();
      
      let key: keyof ProposalData | null = null;
      
      // Map heading to key
      if (heading.includes('title')) key = 'proposal_title';
      else if (heading.includes('summary')) key = 'proposal_summary';
      else if (heading.includes('problem')) key = 'problem';
      else if (heading.includes('solution')) key = 'solution';
      else if (heading.includes('milestone')) key = 'milestones';
      else if (heading.includes('outcome')) key = 'outcomes';
      else if (heading.includes('stakeholder') || heading.includes('impact')) key = 'stakeholder_impact';
      else if (heading.includes('resource')) key = 'resources';
      else if (heading.includes('risk')) key = 'risks';
      else if (heading.includes('alternative')) key = 'alternatives';
      else if (heading.includes('implementation')) key = 'implementation';
      else if (heading.includes('metric')) key = 'metrics';
      else if (heading.includes('reference')) key = 'references';
      
      if (key) {
        if (key === 'proposal_title' || key === 'proposal_summary' || key === 'problem') {
          if (!parsedProposal[key]) {
            parsedProposal[key] = content;
          }
        } else if (Array.isArray(parsedProposal[key]) && parsedProposal[key].length === 0) {
          // Handle array content - look for list items or separate by sentences
          if (content.includes('- ')) {
            const items = content.split(/\n\s*-\s*/)
              .map(item => item.trim())
              .filter(item => item.length > 0);
            parsedProposal[key] = items;
          } else {
            // Split by sentences or paragraphs
            const items = content.split(/\.\s+|n{2,}/)
              .map(item => item.trim())
              .filter(item => item.length > 0 && !item.match(/^\d+$/)); // Filter out single numbers
            
            if (items.length > 0) {
              // Add periods back if needed
              parsedProposal[key] = items.map(item => 
                item.endsWith('.') ? item : `${item}.`
              );
            } else {
              parsedProposal[key] = [content];
            }
          }
        }
      }
    }
    
    // Ensure we have at least placeholder content for empty sections
    Object.keys(parsedProposal).forEach(key => {
      const typedKey = key as keyof ProposalData;
      // Only handle array fields using a type-safe approach
      if (typedKey === 'solution' || typedKey === 'milestones' || 
          typedKey === 'outcomes' || typedKey === 'stakeholder_impact' ||
          typedKey === 'resources' || typedKey === 'risks' || 
          typedKey === 'alternatives' || typedKey === 'implementation' ||
          typedKey === 'metrics' || typedKey === 'references') {
        // Ensure the property is an array
        if (!Array.isArray(parsedProposal[typedKey])) {
          console.error(`Expected array for ${typedKey}, got:`, parsedProposal[typedKey]);
          parsedProposal[typedKey] = [];
        }
        
        // Add placeholder if the array is empty
        if (parsedProposal[typedKey].length === 0) {
          const readableName = key.replace(/_/g, ' ');
          parsedProposal[typedKey] = [`Please add ${readableName} details here`];
          console.log(`Added placeholder for empty section: ${typedKey}`);
        }
      }
    });
    
    return parsedProposal;
  } catch (error) {
    console.error('Error parsing proposal response:', error);
    
    // Create a minimal valid proposal with error information
    const errorProposal: ProposalData = {
      proposal_title: 'Error Parsing Response',
      proposal_summary: 'There was an error parsing the AI response. Please try again with a different idea.',
      problem: 'The response format could not be properly parsed.',
      solution: ['Please try again with a more specific governance idea.'],
      milestones: ['Review the API response format'],
      outcomes: ['Improved parsing of AI responses'],
      stakeholder_impact: ['Users will get more reliable proposal generation'],
      resources: ['Updated parsing logic'],
      risks: ['Continued parsing issues if the response format changes significantly'],
      alternatives: ['Manual proposal creation'],
      implementation: ['Update the parsing logic to handle new response formats'],
      metrics: ['Successful proposal generation rate'],
      references: ['Check console logs for detailed error information']
    };
    
    return errorProposal;
  }
};

/**
 * Formats a section name for display in the UI
 * @param section - The section key from the proposal data
 * @returns Formatted section name for display
 */
export const formatSectionName = (section: string): string => {
  // Replace underscores with spaces and capitalize each word
  return section
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
