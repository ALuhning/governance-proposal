import { Box, Flex, Heading, useColorModeValue } from '@chakra-ui/react';

/**
 * Header component for the application
 */
const Header = () => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  return (
    <Box
      as="header"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      py={4}
      px={6}
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Flex align="center" justify="space-between">
        <Flex align="center">
          {/* You can add the NEAR logo here */}
          <Heading as="h1" size="lg" fontWeight="bold">
            House of Stake
          </Heading>
        </Flex>
      </Flex>
    </Box>
  );
};

export default Header;
