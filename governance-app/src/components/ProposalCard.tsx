import React from 'react';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Image,
  useToast,
  Flex,
  Badge,
  Divider,
  IconButton,
  Tooltip,
} from '@chakra-ui/react';
import { CopyIcon, CheckIcon, CloseIcon } from '@chakra-ui/icons';
import type { ProposalData } from '../types/proposalTypes';

interface ProposalCardProps {
  proposal: ProposalData;
  onClose: () => void;
}

/**
 * Component that displays a summary of the submitted proposal in a card format
 */
const ProposalCard: React.FC<ProposalCardProps> = ({ proposal, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const toast = useToast();

  // Function to generate text to be copied
  const generateCopyText = () => {
    const lines: string[] = [];
    
    // Add title
    lines.push(`# ${proposal.proposal_title}`);
    lines.push('');
    
    // Add summary
    lines.push('## Proposal Summary');
    lines.push(proposal.proposal_summary);
    lines.push('');
    
    // Add problem statement
    lines.push('## Problem Statement');
    lines.push(proposal.problem);
    lines.push('');
    
    // Add list sections
    const addListSection = (title: string, items: string[]) => {
      lines.push(`## ${title}`);
      items.forEach(item => lines.push(`- ${item}`));
      lines.push('');
    };
    
    // Add each section
    addListSection('Proposed Solution', proposal.solution);
    addListSection('Milestones', proposal.milestones);
    addListSection('Expected Outcomes', proposal.outcomes);
    addListSection('Stakeholder Impact', proposal.stakeholder_impact);
    addListSection('Resources Required', proposal.resources);
    addListSection('Risks and Challenges', proposal.risks);
    addListSection('Alternatives Considered', proposal.alternatives);
    addListSection('Implementation Plan', proposal.implementation);
    addListSection('Success Metrics', proposal.metrics);
    addListSection('References', proposal.references);
    
    return lines.join('\n');
  };

  // Function to handle copy to clipboard
  const handleCopy = () => {
    const text = generateCopyText();
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopied(true);
        toast({
          title: "Copied to clipboard",
          description: "Proposal text has been copied to your clipboard",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        
        // Reset copied state after 2 seconds
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(err => {
        toast({
          title: "Failed to copy",
          description: "There was an error copying the text to your clipboard",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        console.error('Failed to copy: ', err);
      });
  };

  // Generate a random image related to governance or proposals
  const getRandomImageUrl = () => {
    const images = [
      'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40',
      'https://images.unsplash.com/photo-1553877522-43269d4ea984',
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4',
      'https://images.unsplash.com/photo-1507208773393-40d9fc670acf'
    ];
    return images[Math.floor(Math.random() * images.length)];
  };

  return (
    <Box 
      borderWidth="1px" 
      borderRadius="lg" 
      overflow="hidden"
      bg="white"
      boxShadow="xl"
      p={6}
      maxW="1000px"
      mx="auto"
      mb={10}
      position="relative"
    >
      {/* Close button */}
      <IconButton
        icon={<CloseIcon />}
        aria-label="Close proposal card"
        size="sm"
        position="absolute"
        top="10px"
        right="10px"
        onClick={onClose}
      />
      
      {/* Header with image, title and copy button */}
      <Flex 
        justify="space-between" 
        align="start" 
        mb={6}
        direction={{ base: 'column', md: 'row' }}
        gap={4}
      >
        <Flex align="center" maxW={{ base: '100%', md: '80%' }}>
          <Image 
            src={getRandomImageUrl()}
            alt="Proposal illustration"
            boxSize={{ base: '80px', md: '100px' }}
            objectFit="cover"
            borderRadius="md"
            mr={4}
          />
          <Heading as="h2" size="xl">{proposal.proposal_title}</Heading>
        </Flex>
        
        <Tooltip 
          label={copied ? "Copied!" : "Copy proposal text to clipboard"} 
          aria-label="Copy tooltip"
        >
          <Button
            leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
            colorScheme={copied ? "green" : "blue"}
            onClick={handleCopy}
            size="md"
          >
            {copied ? "Copied!" : "Copy Proposal"}
          </Button>
        </Tooltip>
      </Flex>

      {/* Summary Section */}
      <Box mb={6} bg="blue.50" p={4} borderRadius="md">
        <Heading as="h3" size="md" mb={2} color="blue.700">Proposal Summary</Heading>
        <Text>{proposal.proposal_summary}</Text>
      </Box>
      
      <Divider mb={6} />
      
      {/* Problem Statement */}
      <Box mb={6}>
        <Heading as="h3" size="md" mb={2} color="blue.700">Motivation / Problem Statement</Heading>
        <Text>{proposal.problem}</Text>
      </Box>
      
      {/* Two-column layout for key sections */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        {/* Left column */}
        <Box>
          <Heading as="h3" size="md" mb={3} color="blue.700">Proposed Solution / Action Plan</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.solution.map((item, idx) => (
              <HStack key={`solution-${idx}`}>
                <Badge colorScheme="blue" borderRadius="full" px={2}>✓</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
          
          <Heading as="h3" size="md" mt={4} mb={3} color="blue.700">Budget and Resource Requirements</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.resources.map((item, idx) => (
              <HStack key={`resource-${idx}`}>
                <Badge colorScheme="cyan" borderRadius="full" px={2}>$</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
          
          <Heading as="h3" size="md" mt={4} mb={3} color="blue.700">Risks and Challenges</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.risks.map((item, idx) => (
              <HStack key={`risk-${idx}`}>
                <Badge colorScheme="red" borderRadius="full" px={2}>!</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
        
        {/* Right column */}
        <Box>
          <Heading as="h3" size="md" mb={3} color="blue.700">Expected Outcomes / Benefits</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.outcomes.map((item, idx) => (
              <HStack key={`outcome-${idx}`}>
                <Badge colorScheme="green" borderRadius="full" px={2}>✓</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
          
          <Heading as="h3" size="md" mt={4} mb={3} color="blue.700">Stakeholder Impact</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.stakeholder_impact.map((item, idx) => (
              <HStack key={`stakeholder-${idx}`}>
                <Badge colorScheme="orange" borderRadius="full" px={2}>→</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
          
          <Heading as="h3" size="md" mt={4} mb={3} color="blue.700">Alternatives Considered</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.alternatives.map((item, idx) => (
              <HStack key={`alternative-${idx}`}>
                <Badge colorScheme="purple" borderRadius="full" px={2}>•</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>
      
      <Divider mb={6} />
      
      {/* Implementation Plan */}
      <Heading as="h3" size="md" mb={3} color="blue.700">Implementation Plan</Heading>
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={4} mb={6}>
        {proposal.implementation.map((item, idx) => (
          <Box 
            key={`implementation-${idx}`} 
            p={3} 
            bg="blue.50" 
            borderRadius="md"
          >
            <Flex align="center">
              <Badge 
                colorScheme="blue" 
                borderRadius="full" 
                fontSize="lg" 
                mr={2}
              >
                {idx + 1}
              </Badge>
              <Text>{item}</Text>
            </Flex>
          </Box>
        ))}
      </SimpleGrid>
      
      {/* Success Metrics and Milestones */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={6}>
        <Box>
          <Heading as="h3" size="md" mb={3} color="blue.700">Success Metrics / KPIs</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.metrics.map((item, idx) => (
              <HStack key={`metric-${idx}`}>
                <Badge colorScheme="green" borderRadius="full" px={2}>•#</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
        
        <Box>
          <Heading as="h3" size="md" mb={3} color="blue.700">Milestones</Heading>
          <VStack align="stretch" spacing={1}>
            {proposal.milestones.map((item, idx) => (
              <HStack key={`milestone-${idx}`}>
                <Badge colorScheme="blue" borderRadius="full" px={2}>•</Badge>
                <Text>{item}</Text>
              </HStack>
            ))}
          </VStack>
        </Box>
      </SimpleGrid>
      
      {/* References */}
      <Box mb={6}>
        <Heading as="h3" size="md" mb={3} color="blue.700">References</Heading>
        <VStack align="stretch" spacing={1}>
          {proposal.references.map((item, idx) => (
            <HStack key={`reference-${idx}`}>
              <Badge colorScheme="gray" borderRadius="full" px={2}>{idx + 1}</Badge>
              <Text>{item}</Text>
            </HStack>
          ))}
        </VStack>
      </Box>
      
      <Flex justify="center" mt={8} gap={6}>
        <Tooltip label="Return to the proposal editor">
          <Button 
            onClick={onClose} 
            colorScheme="gray" 
            size="lg"
            leftIcon={<CloseIcon />}
          >
            Back to Editor
          </Button>
        </Tooltip>
        <Button
          leftIcon={copied ? <CheckIcon /> : <CopyIcon />}
          colorScheme={copied ? "green" : "blue"}
          onClick={handleCopy}
          size="lg"
        >
          {copied ? "Copied!" : "Copy Full Text"}
        </Button>
      </Flex>
    </Box>
  );
};

export default ProposalCard;
