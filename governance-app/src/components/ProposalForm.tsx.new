// filepath: /home/vitalpointai/projects/governance_proposal_agent/governance-app/src/components/ProposalForm.tsx
import React from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Heading,
  Text,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  AlertDescription,
  Badge,
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon } from '@chakra-ui/icons';
import { useProposalForm } from '../hooks/useProposal';
import { TextSection, ListSection } from './ProposalSections';
import { ProposalSection } from '../types/proposalTypes';
import { formatSectionName } from '../utils/proposalUtils';
import ProposalCard from './ProposalCard';

interface ProposalFormProps {
  initialIdea?: string; // Optional now since we don't use it directly
}

/**
 * Main proposal form component
 */
const ProposalForm: React.FC<ProposalFormProps> = () => {
  const {
    isLoading,
    error,
    formData,
    locked,
    allLocked,
    regeneratingItems,
    updateSection,
    regenerateSection,
    regenerateItem,
    toggleSectionLock,
    toggleAllLocked,
    setFormData
  } = useProposalForm();
  
  const toast = useToast();
  
  // State to track if the proposal card should be shown
  const [showProposalCard, setShowProposalCard] = React.useState(false);
  
  // Check if all sections are locked to enable submit button
  const allSectionsLocked = React.useMemo(() => {
    const sections = Object.values(ProposalSection);
    return sections.every(section => !!locked[section]);
  }, [locked]);
  
  // Submit handler for final proposal
  const handleSubmit = () => {
    // In a real app, this would send the proposal to a backend
    toast({
      title: 'Proposal Submitted',
      description: 'Your governance proposal has been submitted successfully!',
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
    console.log('Submitted proposal:', formData);
    
    // Show the proposal card after submission
    setShowProposalCard(true);
  };
  
  // Handle closing the proposal card
  const handleCloseProposalCard = () => {
    setShowProposalCard(false);
  };
  
  // Check if any form data is present to determine if we should show the form
  const hasFormData = Object.values(formData).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0 && value.some(item => item.trim() !== '');
    }
    return value && value.trim() !== '';
  });
  
  // Debug log to see what data we're working with
  console.log('Current form data:', formData);
  
  // Ensure that array fields have at least one item for better UI experience
  // Track whether we've initialized the form
  const [initialized, setInitialized] = React.useState(false);
  
  // Ensure that array fields have at least one item for better UI experience
  React.useEffect(() => {
    // Skip if already initialized or if the form doesn't have data yet
    if (initialized || !hasFormData) {
      return;
    }
    
    // Initialize empty fields
    let needsUpdate = false;
    const updatedFormData = { ...formData };
    
    // Define list sections as array of sections that use string[] values
    const listSections = [
      ProposalSection.SOLUTION,
      ProposalSection.MILESTONES,
      ProposalSection.OUTCOMES,
      ProposalSection.STAKEHOLDER_IMPACT,
      ProposalSection.RESOURCES,
      ProposalSection.RISKS,
      ProposalSection.ALTERNATIVES,
      ProposalSection.IMPLEMENTATION,
      ProposalSection.METRICS,
      ProposalSection.REFERENCES
    ] as const; // Using const assertion for type safety
    
    // Check which sections need initialization
    listSections.forEach(section => {
      if (formData[section].length === 0) {
        // Use type assertion to ensure TypeScript recognizes this as a string array
        (updatedFormData[section] as string[]) = [`Please add ${formatSectionName(section).toLowerCase()} details here`];
        needsUpdate = true;
      }
    });
    
    // Only update if needed to prevent infinite loops
    if (needsUpdate) {
      console.log('Initializing empty form sections');
      setFormData(updatedFormData);
    }
    
    // Mark as initialized
    setInitialized(true);
    
  }, [formData, hasFormData, initialized, setFormData]);
  
  if (isLoading) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>Generating your proposal... This may take a moment.</Text>
      </Container>
    );
  }
  
  if (!hasFormData) {
    return (
      <Container maxW="container.md" py={8}>
        <Text>No proposal data available. Please enter an idea first.</Text>
      </Container>
    );
  }
  
  // If showing the proposal card, render it instead of the form
  if (showProposalCard) {
    return (
      <Container maxW="container.xl" py={8}>
        <ProposalCard 
          proposal={formData} 
          onClose={handleCloseProposalCard} 
        />
      </Container>
    );
  }
  
  return (
    <Container maxW="container.md" py={8}>
      {error && (
        <Alert status="error" mb={6} borderRadius="md">
          <AlertIcon />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Flex justify="space-between" align="center" mb={6}>
        <Heading as="h2" size="xl">
          Governance Proposal
        </Heading>
        <Flex align="center">
          <Badge 
            colorScheme={allLocked ? "purple" : "gray"} 
            fontSize="md" 
            mr={2}
          >
            {allLocked ? "Locked" : "Unlocked"}
          </Badge>
          <Button
            leftIcon={allLocked ? <UnlockIcon /> : <LockIcon />}
            onClick={toggleAllLocked}
            size="md"
          >
            {allLocked ? "Unlock All" : "Lock All"}
          </Button>
        </Flex>
      </Flex>
      
      <VStack spacing={6} align="stretch">
        {/* Text sections */}
        <TextSection
          section={ProposalSection.TITLE}
          value={formData.proposal_title}
          locked={!!locked[ProposalSection.TITLE]}
          onChange={(value) => updateSection(ProposalSection.TITLE, value)}
          onRegenerate={() => regenerateSection(ProposalSection.TITLE)}
          onToggleLock={() => toggleSectionLock(ProposalSection.TITLE)}
          regeneratingItems={regeneratingItems}
        />
        
        <TextSection
          section={ProposalSection.SUMMARY}
          value={formData.proposal_summary}
          locked={!!locked[ProposalSection.SUMMARY]}
          onChange={(value) => updateSection(ProposalSection.SUMMARY, value)}
          onRegenerate={() => regenerateSection(ProposalSection.SUMMARY)}
          onToggleLock={() => toggleSectionLock(ProposalSection.SUMMARY)}
          regeneratingItems={regeneratingItems}
        />
        
        <TextSection
          section={ProposalSection.PROBLEM}
          value={formData.problem}
          locked={!!locked[ProposalSection.PROBLEM]}
          onChange={(value) => updateSection(ProposalSection.PROBLEM, value)}
          onRegenerate={() => regenerateSection(ProposalSection.PROBLEM)}
          onToggleLock={() => toggleSectionLock(ProposalSection.PROBLEM)}
          regeneratingItems={regeneratingItems}
        />
        
        {/* List sections */}
        <ListSection
          section={ProposalSection.SOLUTION}
          value={formData.solution}
          locked={!!locked[ProposalSection.SOLUTION]}
          onChange={(value) => updateSection(ProposalSection.SOLUTION, value)}
          onRegenerate={() => regenerateSection(ProposalSection.SOLUTION)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.SOLUTION, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.SOLUTION)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.MILESTONES}
          value={formData.milestones}
          locked={!!locked[ProposalSection.MILESTONES]}
          onChange={(value) => updateSection(ProposalSection.MILESTONES, value)}
          onRegenerate={() => regenerateSection(ProposalSection.MILESTONES)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.MILESTONES, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.MILESTONES)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.OUTCOMES}
          value={formData.outcomes}
          locked={!!locked[ProposalSection.OUTCOMES]}
          onChange={(value) => updateSection(ProposalSection.OUTCOMES, value)}
          onRegenerate={() => regenerateSection(ProposalSection.OUTCOMES)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.OUTCOMES, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.OUTCOMES)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.STAKEHOLDER_IMPACT}
          value={formData.stakeholder_impact}
          locked={!!locked[ProposalSection.STAKEHOLDER_IMPACT]}
          onChange={(value) => updateSection(ProposalSection.STAKEHOLDER_IMPACT, value)}
          onRegenerate={() => regenerateSection(ProposalSection.STAKEHOLDER_IMPACT)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.STAKEHOLDER_IMPACT, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.STAKEHOLDER_IMPACT)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.RESOURCES}
          value={formData.resources}
          locked={!!locked[ProposalSection.RESOURCES]}
          onChange={(value) => updateSection(ProposalSection.RESOURCES, value)}
          onRegenerate={() => regenerateSection(ProposalSection.RESOURCES)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.RESOURCES, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.RESOURCES)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.RISKS}
          value={formData.risks}
          locked={!!locked[ProposalSection.RISKS]}
          onChange={(value) => updateSection(ProposalSection.RISKS, value)}
          onRegenerate={() => regenerateSection(ProposalSection.RISKS)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.RISKS, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.RISKS)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.ALTERNATIVES}
          value={formData.alternatives}
          locked={!!locked[ProposalSection.ALTERNATIVES]}
          onChange={(value) => updateSection(ProposalSection.ALTERNATIVES, value)}
          onRegenerate={() => regenerateSection(ProposalSection.ALTERNATIVES)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.ALTERNATIVES, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.ALTERNATIVES)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.IMPLEMENTATION}
          value={formData.implementation}
          locked={!!locked[ProposalSection.IMPLEMENTATION]}
          onChange={(value) => updateSection(ProposalSection.IMPLEMENTATION, value)}
          onRegenerate={() => regenerateSection(ProposalSection.IMPLEMENTATION)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.IMPLEMENTATION, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.IMPLEMENTATION)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.METRICS}
          value={formData.metrics}
          locked={!!locked[ProposalSection.METRICS]}
          onChange={(value) => updateSection(ProposalSection.METRICS, value)}
          onRegenerate={() => regenerateSection(ProposalSection.METRICS)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.METRICS, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.METRICS)}
          regeneratingItems={regeneratingItems}
        />
        
        <ListSection
          section={ProposalSection.REFERENCES}
          value={formData.references}
          locked={!!locked[ProposalSection.REFERENCES]}
          onChange={(value) => updateSection(ProposalSection.REFERENCES, value)}
          onRegenerate={() => regenerateSection(ProposalSection.REFERENCES)}
          onRegenerateItem={(index) => regenerateItem(ProposalSection.REFERENCES, index)}
          onToggleLock={() => toggleSectionLock(ProposalSection.REFERENCES)}
          regeneratingItems={regeneratingItems}
        />
        
        {/* Submit button */}
        <Box py={4}>
          <Button
            colorScheme="blue"
            size="lg"
            width="full"
            onClick={handleSubmit}
            isDisabled={!allSectionsLocked}
            _hover={{ 
              bg: allSectionsLocked ? 'blue.600' : undefined 
            }}
            _disabled={{
              backgroundColor: 'gray.300',
              cursor: 'not-allowed',
              _hover: { backgroundColor: 'gray.300' }
            }}
          >
            {allSectionsLocked ? 'Submit Proposal' : 'Lock All Sections to Submit'}
          </Button>
        </Box>
      </VStack>
    </Container>
  );
};

export default ProposalForm;
