import { Box, Container, Text, Link, useColorModeValue } from '@chakra-ui/react';

/**
 * Footer component for the application
 */
const Footer = () => {
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  
  return (
    <Box
      as="footer"
      bg={bgColor}
      color={textColor}
      py={6}
      mt="auto"
    >
      <Container maxW="container.lg">
        <Text textAlign="center" fontSize="sm">
          © {new Date().getFullYear()} NEAR Governance Proposal Generator. Powered by{' '}
          <Link href="https://near.org" isExternal fontWeight="semibold">
            NEAR Protocol
          </Link>
          .
        </Text>
      </Container>
    </Box>
  );
};

export default Footer;
