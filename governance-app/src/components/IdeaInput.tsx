import React from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useProposalIdea } from '../hooks/useProposal';

interface IdeaInputProps {
  onIdeaSubmitted: (idea: string) => void;
}

/**
 * Component for inputting the initial governance idea
 */
const IdeaInput: React.FC<IdeaInputProps> = ({ onIdeaSubmitted }) => {
  const { idea, setIdea, submitIdea, isLoading, error } = useProposalIdea();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitIdea();
    onIdeaSubmitted(idea);
  };
  
  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="xl" mb={2}>
            NEAR Governance Proposal Generator
          </Heading>
          <Text fontSize="lg" color="gray.500">
            Enter your governance idea and we'll create a comprehensive proposal for you
          </Text>
        </Box>
        
        <Box
          as="form"
          onSubmit={handleSubmit}
          borderWidth="1px"
          borderRadius="lg"
          p={8}
          bg={bgColor}
          borderColor={borderColor}
          shadow="md"
        >
          {error && (
            <Alert status="error" mb={6} borderRadius="md">
              <AlertIcon />
              <AlertTitle mr={2}>Error!</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel fontSize="lg">What's your governance idea?</FormLabel>
              <Input
                placeholder="e.g. Content creators should be rewarded for their contribution to NEAR"
                size="lg"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
              <Text mt={2} fontSize="sm" color="gray.500">
                Be specific about what problem you're trying to solve and what your proposed solution is.
              </Text>
            </FormControl>
            
            <Button
              colorScheme="blue"
              size="lg"
              width="full"
              type="submit"
              isLoading={isLoading}
              loadingText="Generating Proposal..."
            >
              Generate Proposal
            </Button>
          </VStack>
        </Box>
        
        <Box>
          <Text fontSize="sm" color="gray.500">
            Note: The generated proposal is a starting point. You'll be able to edit and refine each section afterward.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default IdeaInput;
