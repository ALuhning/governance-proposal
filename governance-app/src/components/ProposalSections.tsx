import React from 'react';
import {
  Box,
  Button,
  Flex,
  FormControl,
  Input,
  Textarea,
  VStack,
  IconButton,
  Heading,
  useColorModeValue,
  Badge,
  HStack,
  Text
} from '@chakra-ui/react';
import { LockIcon, UnlockIcon, RepeatIcon, DeleteIcon, AddIcon } from '@chakra-ui/icons';
import { ProposalSection } from '../types/proposalTypes';
import { formatSectionName } from '../utils/proposalUtils';

interface TextSectionProps {
  section: ProposalSection;
  value: string;
  locked: boolean;
  onChange: (value: string) => void;
  onRegenerate: () => void;
  onToggleLock: () => void;
  regeneratingItems?: {[key: string]: boolean};
}

interface ListSectionProps {
  section: ProposalSection;
  value: string[];
  locked: boolean;
  onChange: (value: string[]) => void;
  onRegenerate: () => void;
  onRegenerateItem?: (index: number) => void;
  onToggleLock: () => void;
  regeneratingItems?: {[key: string]: boolean};
}

/**
 * Component for text section (title, summary, problem)
 */
export const TextSection: React.FC<TextSectionProps> = ({
  section,
  value,
  locked,
  onChange,
  onRegenerate,
  onToggleLock,
  regeneratingItems = {}
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionTitle = formatSectionName(section);
  
  // Use Textarea for longer sections, Input for title
  const isTitle = section === ProposalSection.TITLE;
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={5}
      mb={5}
      bg={bgColor}
      borderColor={borderColor}
      position="relative"
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h3" size="md">
          {sectionTitle}
        </Heading>
        <HStack spacing={2}>
          {locked && <Badge colorScheme="purple">Locked</Badge>}
          {regeneratingItems[`section-${section}`] && <Badge colorScheme="blue">Regenerating...</Badge>}
          <IconButton
            aria-label={locked ? "Unlock section" : "Lock section"}
            icon={locked ? <UnlockIcon /> : <LockIcon />}
            size="sm"
            onClick={onToggleLock}
          />
          <IconButton
            aria-label="Regenerate with feedback"
            icon={<RepeatIcon />}
            size="sm"
            onClick={onRegenerate}
            isDisabled={locked || regeneratingItems[`section-${section}`]}
            isLoading={regeneratingItems[`section-${section}`]}
            title="Regenerate with feedback"
          />
        </HStack>
      </Flex>
      
      <FormControl>
        {isTitle ? (
          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${sectionTitle.toLowerCase()}`}
            size="md"
            disabled={locked}
          />
        ) : (
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Enter ${sectionTitle.toLowerCase()}`}
            size="md"
            minH="100px"
            disabled={locked}
          />
        )}
      </FormControl>
    </Box>
  );
};

/**
 * Component for list section (solutions, milestones, etc.)
 */
export const ListSection: React.FC<ListSectionProps> = ({
  section,
  value,
  locked,
  onChange,
  onRegenerate,
  onRegenerateItem,
  onToggleLock,
  regeneratingItems = {}
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const sectionTitle = formatSectionName(section);
  
  // Function to handle adding a new item
  const handleAddItem = () => {
    onChange([...value, '']);
  };
  
  // Function to handle updating an item
  const handleUpdateItem = (index: number, newValue: string) => {
    const newItems = [...value];
    newItems[index] = newValue;
    onChange(newItems);
  };
  
  // Function to handle deleting an item
  const handleDeleteItem = (index: number) => {
    const newItems = value.filter((_, i) => i !== index);
    onChange(newItems);
  };
  
  // Ensure we have a valid array to work with
  let safeValue = Array.isArray(value) ? value : [];
  
  // If value is not a valid array, log an error
  if (!Array.isArray(value)) {
    console.error(`ListSection expected array for ${section}, but got:`, value);
    // Try to recover if possible
    try {
      // Force the value to string type
      const valueStr = String(value || '');
      if (valueStr.trim().length > 0) {
        // If it's a string, try to split it
        if (valueStr.includes('\n')) {
          safeValue = valueStr.split('\n').filter(Boolean);
        } else if (valueStr.includes(',')) {
          safeValue = valueStr.split(',').map((item: string) => item.trim()).filter(Boolean);
        } else {
          safeValue = [valueStr];
        }
      }
    } catch (err) {
      console.error('Failed to recover array value:', err);
    }
  }
  
  // Special handling for references section
  if (section === ProposalSection.REFERENCES) {
    console.log("References section value:", value);
    console.log("References array type:", Array.isArray(value) ? "Array" : typeof value);
    console.log("References item count:", Array.isArray(value) ? value.length : "N/A");
    if (Array.isArray(value) && value.length > 0) {
      console.log("First reference item:", value[0]);
      console.log("First item type:", typeof value[0]);
    }
    
    // Force normalization of references
    if (Array.isArray(value)) {
      // Ensure each item is properly formatted with consistent numbering
      safeValue = value.map((item, index) => {
        if (item && typeof item === 'string') {
          const trimmed = item.trim();
          
          // Check if it's already properly formatted with any number
          if (trimmed.match(/^\d+\.\s*\[.*\]$/)) {
            console.log("Reference already in proper format, renumbering:", trimmed);
            // Extract the content between brackets and renumber
            const bracketContent = trimmed.match(/\[(.*)\]/);
            if (bracketContent && bracketContent[1]) {
              return `${index + 1}. [${bracketContent[1]}]`;
            }
            return trimmed; // Keep as is if we couldn't extract the content
          } 
          // Check if it has brackets but no number
          else if (trimmed.match(/^\[.*\]$/)) {
            console.log("Adding number to reference:", trimmed);
            return `${index + 1}. ${trimmed}`;
          }
          // Add both number and brackets if neither is present
          else if (!trimmed.includes('[') && !trimmed.includes(']')) {
            console.log("Adding full reference format to:", trimmed);
            return `${index + 1}. [${trimmed}]`;
          }
          // If it has a different format, try to extract content and reformat
          else {
            console.log("Reformatting reference:", trimmed);
            // Try to extract content between brackets if they exist
            const bracketContent = trimmed.match(/\[(.*)\]/);
            if (bracketContent && bracketContent[1]) {
              return `${index + 1}. [${bracketContent[1]}]`;
            }
            // Otherwise just use the whole text
            return `${index + 1}. [${trimmed}]`;
          }
        }
        return `${index + 1}. [${String(item || "")}]`;
      });
    }
  }
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={5}
      mb={5}
      bg={bgColor}
      borderColor={borderColor}
    >
      <Flex justify="space-between" align="center" mb={4}>
        <Heading as="h3" size="md">
          {sectionTitle}
        </Heading>
        <HStack spacing={2}>
          {locked && <Badge colorScheme="purple">Locked</Badge>}
          {regeneratingItems[`section-${section}`] && <Badge colorScheme="blue">Regenerating...</Badge>}
          <IconButton
            aria-label={locked ? "Unlock section" : "Lock section"}
            icon={locked ? <UnlockIcon /> : <LockIcon />}
            size="sm"
            onClick={onToggleLock}
          />
          <IconButton
            aria-label="Regenerate with feedback"
            icon={<RepeatIcon />}
            size="sm"
            onClick={onRegenerate}
            isDisabled={locked || regeneratingItems[`section-${section}`]}
            isLoading={regeneratingItems[`section-${section}`]}
            title="Regenerate with feedback"
          />
        </HStack>
      </Flex>
      
      <VStack spacing={3} align="stretch">
        {safeValue.length === 0 ? (
          // Display a placeholder when the array is empty
          <Box>
            <Text color="gray.500" fontSize="sm" mb={2}>
              No {sectionTitle.toLowerCase()} available. Click 'Add Item' to create one.
            </Text>
            <Button
              leftIcon={<AddIcon />}
              onClick={handleAddItem}
              size="sm"
              colorScheme="blue"
              variant="outline"
              isDisabled={locked}
            >
              Add First Item
            </Button>
          </Box>
        ) : (
          // Otherwise render each item
          safeValue.map((item, index) => (
            <Flex key={index} align="center" direction="column" w="100%">
              <Flex w="100%" align="center">
                <Textarea
                  value={item}
                  onChange={(e) => {
                    // For references section, add debug info
                    const newValue = e.target.value;
                    if (section === ProposalSection.REFERENCES) {
                      console.log("Reference input value changed:", newValue);
                    }
                    handleUpdateItem(index, newValue);
                  }}
                  placeholder={section === ProposalSection.REFERENCES ? 
                    `Enter reference (e.g., [Link to resource])` : 
                    `Enter ${sectionTitle.toLowerCase()} item`}
                  size="md"
                  disabled={locked}
                  flex={1}
                  isDisabled={regeneratingItems && regeneratingItems[`${section}-${index}`] || locked}
                />
                <Box ml={2}>
                  <VStack>
                    {onRegenerateItem && (
                      <IconButton
                        aria-label="Regenerate item with feedback"
                        icon={<RepeatIcon />}
                        size="sm"
                        onClick={() => {
                          if (onRegenerateItem) onRegenerateItem(index);
                        }}
                        isDisabled={regeneratingItems && regeneratingItems[`${section}-${index}`] || locked}
                        isLoading={regeneratingItems && regeneratingItems[`${section}-${index}`]}
                        colorScheme="blue"
                        title="Regenerate with feedback"
                      />
                    )}
                    <IconButton
                      aria-label="Delete item"
                      icon={<DeleteIcon />}
                      size="sm"
                      onClick={() => handleDeleteItem(index)}
                      isDisabled={locked}
                      colorScheme="red"
                    />
                  </VStack>
                </Box>
              </Flex>
              {regeneratingItems && regeneratingItems[`${section}-${index}`] && (
                <Text fontSize="xs" color="blue.500" alignSelf="flex-start" mt={1}>
                  Regenerating...
                </Text>
              )}
            </Flex>
          ))
        )}
        
        <Button
          leftIcon={<AddIcon />}
          onClick={handleAddItem}
          size="sm"
          variant="outline"
          isDisabled={locked}
        >
          Add Item
        </Button>
      </VStack>
    </Box>
  );
};
