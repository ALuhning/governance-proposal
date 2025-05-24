import { useState } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import IdeaInput from '../components/IdeaInput';
import ProposalForm from '../components/ProposalForm';

/**
 * Home page component
 */
const HomePage = () => {
  const [ideaSubmitted, setIdeaSubmitted] = useState(false);
  const [currentIdea, setCurrentIdea] = useState('');
  
  const handleIdeaSubmitted = (idea: string) => {
    setIdeaSubmitted(true);
    setCurrentIdea(idea);
  };
  
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      
      <Box flex="1">
        {!ideaSubmitted ? (
          <IdeaInput onIdeaSubmitted={handleIdeaSubmitted} />
        ) : (
          <ProposalForm initialIdea={currentIdea} />
        )}
      </Box>
      
      <Footer />
    </Flex>
  );
};

export default HomePage;
