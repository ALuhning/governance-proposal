import { useState } from 'react';
import { generateProposal, regenerateSectionContent } from '../services/langflowService';
import { parseProposalResponse, formatSectionName } from '../utils/proposalUtils';
import { useProposalStore } from '../store/proposalStore';
import { ProposalSection } from '../types/proposalTypes';

/**
 * Custom hook for handling proposal generation and section updates
 */
export const useProposalForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Track which items are currently regenerating
  const [regeneratingItems, setRegeneratingItems] = useState<{[key: string]: boolean}>({});
  
  // States for the feedback modal
  const [feedbackModalState, setFeedbackModalState] = useState({
    isOpen: false,
    section: null as ProposalSection | null,
    type: null as 'section' | 'item' | null,
    index: undefined as number | undefined,
    content: ''
  });
  
  const { 
    formData, 
    locked, 
    setFormData, 
    updateSection,
    setLockStatus,
    allLocked,
    setAllLocked
  } = useProposalStore();
  
  /**
   * Generates a proposal using the given governance idea
   */
  const handleGenerateProposal = async (idea: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Call Langflow API
      const response = await generateProposal(idea);
      
      // Parse the response
      const parsedProposal = await parseProposalResponse(response);
      
      console.log('Generated proposal data:', parsedProposal);
      
      // Ensure all array fields have at least one item for better UX
      Object.keys(parsedProposal).forEach(key => {
        const typedKey = key as keyof typeof parsedProposal;
        if (Array.isArray(parsedProposal[typedKey]) && parsedProposal[typedKey].length === 0) {
          // Add a default item to empty arrays
          if (typedKey === 'solution' || typedKey === 'milestones' || 
              typedKey === 'outcomes' || typedKey === 'stakeholder_impact' ||
              typedKey === 'resources' || typedKey === 'risks' || 
              typedKey === 'alternatives' || typedKey === 'implementation' ||
              typedKey === 'metrics' || typedKey === 'references') {
            const readableName = key.replace(/_/g, ' ');
            (parsedProposal[typedKey] as string[]).push(`Add ${readableName} details here`);
          }
        }
      });
      
      // Update the form data in store
      setFormData(parsedProposal);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Opens the feedback modal for a specific section
   * @param section - The section to regenerate
   */
  const openFeedbackForSection = (section: ProposalSection) => {
    // Only allow regeneration if section is not locked
    if (locked[section]) {
      return;
    }
    
    // Get the current content of the section
    const currentContent = formData[section];
    
    // Prepare the text to show in the feedback modal
    const textToShow = Array.isArray(currentContent) 
      ? currentContent.join('\n')  // Convert array to string for list sections
      : currentContent;            // Text sections can be used as is
    
    // Set the feedback modal state
    setFeedbackModalState({
      isOpen: true,
      section: section,
      type: 'section',
      index: undefined,
      content: textToShow
    });
  };
  
  /**
   * Regenerates a specific section of the proposal with optional feedback
   * @param section - The section to regenerate
   * @param feedback - Optional user feedback to guide the regeneration
   */
  const regenerateSection = async (section: ProposalSection, feedback?: string) => {
    // Only regenerate if section is not locked
    if (locked[section]) {
      return;
    }
    
    // Close the feedback modal if it's open
    setFeedbackModalState(prev => ({ ...prev, isOpen: false }));
    
    // Mark this section as regenerating
    const sectionId = `section-${section}`;
    setRegeneratingItems(prev => ({ ...prev, [sectionId]: true }));
    setError(null);
    
    try {
      // Get the current content of the section
      const currentContent = formData[section];
      
      // Prepare the text to send to the regeneration API
      const textToRegenerate = Array.isArray(currentContent) 
        ? currentContent.join('\n')  // Convert array to string for list sections
        : currentContent;            // Text sections can be used as is
      
      // Different handling based on section type
      if (typeof currentContent === 'string') {
        // For text sections (title, summary, problem)
        const regeneratedText = await regenerateSectionContent(textToRegenerate, feedback);
        updateSection(section, regeneratedText);
      } else if (Array.isArray(currentContent)) {
        // For list sections
        const regeneratedText = await regenerateSectionContent(textToRegenerate, feedback);
        
        // Special handling for references section
        let regeneratedArray;
        if (section === ProposalSection.REFERENCES) {
          // Use our specialized reference parser
          const { parseReferences } = await import('../utils/arrayUtils');
          console.log("References regenerated text:", regeneratedText);
          
          // Parse the references with our specialized function
          const parsedReferences = parseReferences(regeneratedText);
          
          // Ensure consistent numbering and formatting
          regeneratedArray = parsedReferences.map((ref, index) => {
            // Extract content between brackets if present
            const bracketContent = ref.match(/\[(.*)\]/);
            if (bracketContent && bracketContent[1]) {
              return `${index + 1}. [${bracketContent[1]}]`;
            }
            // If no brackets found, wrap the entire content
            return `${index + 1}. [${ref.replace(/^\d+\.\s*/, '')}]`;
          });
          
          console.log("Parsed references array:", regeneratedArray);
        } else {
          // For other list sections, split by newlines
          regeneratedArray = regeneratedText
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
        }
        
        // If we got empty results, keep at least one item
        const finalArray = regeneratedArray.length > 0 
          ? regeneratedArray 
          : [`Add ${formatSectionName(section).toLowerCase()} details here`];
        
        updateSection(section, finalArray);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      // Clear the regenerating state for this section
      setRegeneratingItems(prev => {
        const updated = { ...prev };
        delete updated[`section-${section}`];
        return updated;
      });
    }
  };
  
  /**
   * Opens the feedback modal for a specific item in a list section
   * @param section - The section containing the item
   * @param index - The index of the item in the array
   */
  const openFeedbackForItem = (section: ProposalSection, index: number) => {
    // Only allow regeneration if section is not locked
    if (locked[section]) {
      return;
    }
    
    // Get the current content of the section
    const sectionContent = formData[section];
    
    // Make sure this is an array section and the index is valid
    if (!Array.isArray(sectionContent) || index < 0 || index >= sectionContent.length) {
      console.error(`Invalid array index ${index} for section ${section}`);
      return;
    }
    
    // Get the current item text
    const currentItemText = sectionContent[index];
    
    // Set the feedback modal state
    setFeedbackModalState({
      isOpen: true,
      section: section,
      type: 'item',
      index: index,
      content: currentItemText
    });
  };
  
  /**
   * Regenerates a specific item in a list section with optional feedback
   * @param section - The section containing the item
   * @param index - The index of the item in the array
   * @param feedback - Optional user feedback to guide the regeneration
   */
  const regenerateItem = async (section: ProposalSection, index: number, feedback?: string) => {
    // Only regenerate if section is not locked
    if (locked[section]) {
      return;
    }
    
    // Close the feedback modal if it's open
    setFeedbackModalState(prev => ({ ...prev, isOpen: false }));
    
    // Get the current content of the section
    const sectionContent = formData[section];
    
    // Make sure this is an array section and the index is valid
    if (!Array.isArray(sectionContent) || index < 0 || index >= sectionContent.length) {
      console.error(`Invalid array index ${index} for section ${section}`);
      return;
    }
    
    // Mark this specific item as regenerating
    const itemId = `${section}-${index}`;
    setRegeneratingItems(prev => ({ ...prev, [itemId]: true }));
    setError(null);
    
    try {
      // Get the current item text
      const currentItemText = sectionContent[index];
      
      // Regenerate just this item
      const regeneratedText = await regenerateSectionContent(currentItemText, feedback);
      
      // Create a new array with the regenerated item
      const updatedItems = [...sectionContent];
      
      // Special handling for references section
      if (section === ProposalSection.REFERENCES) {
        // Use our specialized reference parser
        const { parseReferences } = await import('../utils/arrayUtils');
        console.log("Regenerated reference item text:", regeneratedText);
        
        // Check for numbered list format specifically (e.g., "1. [Link text]")
        const numberedPattern = /^\d+\.\s*\[.*\]/;
        
        if (numberedPattern.test(regeneratedText.trim())) {
          // If it's already in the right format, use it directly but ensure it has the correct index number
          // Extract content between brackets
          const bracketContent = regeneratedText.trim().match(/\[(.*)\]/);
          if (bracketContent && bracketContent[1]) {
            // Preserve index+1 for proper ordering (item numbers start from 1)
            updatedItems[index] = `${index + 1}. [${bracketContent[1]}]`;
          } else {
            updatedItems[index] = regeneratedText.trim();
          }
          console.log("Used numbered reference format with index:", index + 1);
        } else {
          // Try to parse it with our specialized function
          const parsed = parseReferences(regeneratedText);
          console.log("Parsed reference item:", parsed);
          
          // Use the first item if available, otherwise keep the original
          if (parsed.length > 0) {
            // Extract content between brackets to renumber properly
            const firstItem = parsed[0];
            const bracketContent = firstItem.match(/\[(.*)\]/);
            
            if (bracketContent && bracketContent[1]) {
              // Preserve index+1 for proper ordering
              updatedItems[index] = `${index + 1}. [${bracketContent[1]}]`;
            } else {
              updatedItems[index] = parsed[0];
            }
          } else {
            // If parsing failed, format the original properly
            updatedItems[index] = `${index + 1}. [${currentItemText.trim().replace(/^\d+\.\s*\[|\]$/g, '')}]`;
          }
        }
      } else {
        // Simply replace the item with the regenerated text
        updatedItems[index] = regeneratedText.trim() || currentItemText;
      }
      
      // Update the section with the new array
      updateSection(section, updatedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      // Clear the regenerating state for this item
      setRegeneratingItems(prev => {
        const updated = { ...prev };
        delete updated[itemId];
        return updated;
      });
    }
  };
  
  /**
   * Toggles the locked state of a section
   */
  const toggleSectionLock = (section: ProposalSection) => {
    setLockStatus(section, !locked[section]);
  };
  
  /**
   * Toggles the locked state of the entire proposal
   */
  const toggleAllLocked = () => {
    setAllLocked(!allLocked);
  };
  
  /**
   * Handles feedback submission from the modal
   * @param feedback - The feedback provided by the user
   */
  const handleFeedbackSubmit = (feedback: string) => {
    const { section, type, index } = feedbackModalState;
    
    if (!section) return;
    
    if (type === 'section') {
      regenerateSection(section as ProposalSection, feedback);
    } else if (type === 'item' && index !== undefined) {
      regenerateItem(section as ProposalSection, index, feedback);
    }
  };
  
  /**
   * Close the feedback modal
   */
  const closeFeedbackModal = () => {
    setFeedbackModalState(prev => ({ ...prev, isOpen: false }));
  };

  // Instead of providing the feedback modal component, provide the required state and handlers
  const getFeedbackModalProps = () => ({
    isOpen: feedbackModalState.isOpen,
    onClose: closeFeedbackModal,
    onSubmit: handleFeedbackSubmit,
    title: feedbackModalState.section 
      ? (feedbackModalState.type === 'section' 
        ? formatSectionName(feedbackModalState.section as ProposalSection) 
        : `${formatSectionName(feedbackModalState.section as ProposalSection)} Item`)
      : '',
    content: feedbackModalState.content,
    isLoading: feedbackModalState.section 
      ? (feedbackModalState.type === 'section' 
        ? !!regeneratingItems[`section-${feedbackModalState.section}`] 
        : !!regeneratingItems[`${feedbackModalState.section}-${feedbackModalState.index}`])
      : false
  });
  
  return {
    isLoading,
    error,
    formData,
    locked,
    allLocked,
    regeneratingItems,
    handleGenerateProposal,
    updateSection,
    regenerateSection,
    regenerateItem,
    toggleSectionLock,
    toggleAllLocked,
    setFormData,
    // New exports for feedback functionality
    openFeedbackForSection,
    openFeedbackForItem,
    closeFeedbackModal,
    handleFeedbackSubmit,
    feedbackModalState,
    getFeedbackModalProps
  };
};

/**
 * Custom hook for the initial proposal idea input
 */
export const useProposalIdea = () => {
  const [idea, setIdea] = useState('');
  const { handleGenerateProposal, isLoading, error } = useProposalForm();
  
  const submitIdea = async () => {
    if (!idea.trim()) return;
    await handleGenerateProposal(idea);
  };
  
  return {
    idea,
    setIdea,
    submitIdea,
    isLoading,
    error
  };
};
