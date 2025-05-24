import axios from 'axios';

const LANGFLOW_API_URL = 'https://ai.vitalpoint.ai/api/v1/run/6fa9f884-81d2-4412-85fd-e892c8007169?stream=false';
const REGENERATE_SECTION_API_URL = 'https://ai.vitalpoint.ai/api/v1/run/cc1a00a3-3791-44ec-b8b0-3c9a409e41a4?stream=false';

// Type for the Langflow API response
export interface LangflowResponse {
  session_id: string;
  outputs: {
    inputs: {
      input_value: string;
    };
    outputs: {
      results: {
        message: {
          text: string;
          // Other fields omitted for brevity
        };
      };
      // Other fields omitted for brevity
    }[];
  }[];
}

// Extended interface to allow safe type checking for unexpected result formats
interface ExtendedResults {
  message?: {
    text?: string;
  };
  text?: string;
  [key: string]: unknown;
}

/**
 * Regenerates a specific section of the proposal
 * @param sectionText - The current content of the section to regenerate
 * @param feedback - Optional user feedback to guide the regeneration
 * @returns A string with the regenerated content for that section
 */
export const regenerateSectionContent = async (sectionText: string, feedback?: string): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_LANGFLOW_API_KEY;
    
    if (!apiKey) {
      throw new Error('Langflow API key not found. Please set VITE_LANGFLOW_API_KEY in your environment variables.');
    }

    // Format input with feedback if provided
    let inputValue = sectionText;
    if (feedback && feedback.trim()) {
      // Add the feedback using the Original/Feedback structure
      inputValue = `Original: ${sectionText}\nFeedback: ${feedback.trim()}\n\nPlease regenerate the content considering this feedback.`;
    }

    const response = await axios.post(
      REGENERATE_SECTION_API_URL,
      {
        input_value: inputValue,
        output_type: 'chat',
        input_type: 'chat'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    // Extract the text from the response
    let regeneratedText = '';
    try {
      // Get the raw text response
      regeneratedText = response.data.outputs[0].outputs[0].results.message.text;
      
      // Basic validation
      if (!regeneratedText || typeof regeneratedText !== 'string') {
        throw new Error('Invalid response format: message text missing or not a string');
      }
    } catch (parseError) {
      console.error('Error extracting regenerated text from API response:', parseError);
      
      // Try alternative ways to extract the text similar to generateProposal function
      if (response.data && 
          typeof response.data === 'object' && 
          'outputs' in response.data && 
          Array.isArray(response.data.outputs) && 
          response.data.outputs.length > 0) {
        
        // Try to find any text content in the outputs
        try {
          for (const output of response.data.outputs) {
            if (output.outputs && 
                Array.isArray(output.outputs) && 
                output.outputs.length > 0 &&
                output.outputs[0].results) {
                
              // Cast to our extended type for safer property access
              const results = output.outputs[0].results as ExtendedResults;
              
              // Try to find message.text first (standard path)
              if (results.message?.text) {
                regeneratedText = results.message.text;
                break;
              }
              
              // Try direct text property 
              if (results.text) {
                regeneratedText = results.text;
                break;
              }
              
              // Last resort - stringify the entire results object
              regeneratedText = JSON.stringify(results);
              break;
            }
          }
        } catch (nestedError) {
          console.error('Error in deep path extraction:', nestedError);
        }
      }
      
      // If we still don't have any text, return the original section text
      if (!regeneratedText) {
        regeneratedText = sectionText;
      }
    }
    
    return regeneratedText;
  } catch (error) {
    console.error('Error regenerating section:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error('Failed to regenerate section. Please try again.');
  }
};

/**
 * Sends a governance idea to the Langflow API and returns the response
 * @param idea - The governance idea input from the user
 * @returns The parsed proposal data
 */
export const generateProposal = async (idea: string): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_LANGFLOW_API_KEY;
    
    if (!apiKey) {
      throw new Error('Langflow API key not found. Please set VITE_LANGFLOW_API_KEY in your environment variables.');
    }

    const response = await axios.post<LangflowResponse>(
      LANGFLOW_API_URL,
      {
        input_value: idea,
        output_type: 'chat',
        input_type: 'chat'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );

    // Extract the text from the response with better error handling
    let proposalText = '';
    try {
      // Get the raw text response without any manipulation
      proposalText = response.data.outputs[0].outputs[0].results.message.text;
      console.log("Raw proposal text (preview):", 
        proposalText.substring(0, 100) + 
        (proposalText.length > 100 ? "..." : ""));
      
      // Basic validation
      if (!proposalText || typeof proposalText !== 'string') {
        throw new Error('Invalid response format: message text missing or not a string');
      }
    } catch (parseError) {
      console.error('Error extracting text from API response:', parseError);
      
      // Try alternative ways to extract the text
      if (response.data && 
          typeof response.data === 'object' && 
          'outputs' in response.data && 
          Array.isArray(response.data.outputs) && 
          response.data.outputs.length > 0) {
        
        // Try to find any text content in the outputs
        try {
          for (const output of response.data.outputs) {
            if (output.outputs && 
                Array.isArray(output.outputs) && 
                output.outputs.length > 0 &&
                output.outputs[0].results) {
                
              // Cast to our extended type for safer property access
              const results = output.outputs[0].results as ExtendedResults;
              
              // Try to find message.text first (standard path)
              if (results.message?.text) {
                proposalText = results.message.text;
                break;
              }
              
              // Try direct text property 
              if (results.text) {
                proposalText = results.text;
                break;
              }
              
              // Last resort - stringify the entire results object
              proposalText = JSON.stringify(results);
              break;
            }
          }
        } catch (nestedError) {
          console.error('Error in deep path extraction:', nestedError);
        }
        
        // If we still don't have text, stringify the outputs as a last resort
        if (!proposalText) {
          proposalText = JSON.stringify(response.data.outputs);
        }
      }
      
      // If we still don't have any text, create a default error response
      if (!proposalText) {
        proposalText = `proposal_title: 'Error Retrieving Response', 
                       proposal_summary: 'There was an error retrieving the AI response.',
                       problem: 'The API response could not be parsed correctly.',
                       solution: ['Please try again with a different idea.']`;
      }
    }
    
    return proposalText;
  } catch (error) {
    console.error('Error generating proposal:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw new Error('Failed to generate proposal. Please try again.');
  }
};
