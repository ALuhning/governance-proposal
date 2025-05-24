// Manual test for the regeneration API functionality
import { regenerateSectionContent } from './services/langflowService';

// Test text with the references issue
const referencesTest = `1. [Link to community discussion on content creator rewards]
2. [Link to research on content creator incentivization]
3. [Link to NEAR Protocol treasury management guidelines]`;

console.log('Testing regeneration API with references content:');
console.log(referencesTest);

async function testRegeneration() {
  try {
    const result = await regenerateSectionContent(referencesTest);
    console.log('\nAPI Response:');
    console.log(result);

    console.log('\nParsing the response:');
    
    // Import our specialized array parsing utility
    const { safeArrayParse } = await import('./utils/arrayUtils');
    
    // Test scenario 1: If response contains brackets
    if (result.includes('[') && result.includes(']')) {
      console.log('Response contains brackets, parsing as array:');
      const parsedResult = safeArrayParse(result);
      console.log(parsedResult);
    } 
    
    // Test scenario 2: Split by newlines as fallback
    console.log('Parsing by splitting newlines:');
    const splitResult = result
      .split('\n')
      .map(item => item.trim())
      .filter(item => item.length > 0);
    console.log(splitResult);
  } catch (error) {
    console.error('Error testing regeneration:', error);
  }
}

testRegeneration();
