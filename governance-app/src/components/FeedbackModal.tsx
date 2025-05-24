import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Textarea,
  Text,
  FormControl,
  FormLabel
} from '@chakra-ui/react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  title: string;
  content: string;
  isLoading: boolean;
}

/**
 * Modal component for collecting user feedback for regeneration
 */
const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  content,
  isLoading
}) => {
  const [feedback, setFeedback] = React.useState('');

  const handleSubmit = () => {
    onSubmit(feedback);
    setFeedback('');
  };

  // Clear feedback when modal closes
  React.useEffect(() => {
    if (!isOpen) {
      setFeedback('');
    }
  }, [isOpen]);

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Regenerate {title}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text mb={4}>
            Current content:
          </Text>
          <Text 
            p={2} 
            bg="gray.50" 
            borderRadius="md" 
            fontSize="sm" 
            fontFamily="mono"
            mb={4}
            maxH="150px"
            overflowY="auto"
          >
            {content}
          </Text>
          
          <FormControl>
            <FormLabel>
              Add your feedback or instructions for the AI (optional):
            </FormLabel>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="E.g., Make it more concise, focus on technical aspects, include more examples..."
              rows={4}
            />
          </FormControl>
        </ModalBody>

        <ModalFooter>
          <Button variant="outline" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button 
            colorScheme="blue" 
            onClick={handleSubmit} 
            isLoading={isLoading}
            isDisabled={isLoading}
          >
            Regenerate
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default FeedbackModal;
