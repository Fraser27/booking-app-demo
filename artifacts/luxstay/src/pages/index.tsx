import { Box, Container, Header } from '@cloudscape-design/components';
import WelcomePage from '../components/WelcomePage';

export const NotFound = () => (
  <Container>
    <Box textAlign="center" padding="xxl">
      <Header variant="h1">404 - Page Not Found</Header>
    </Box>
  </Container>
);

export const HomePage = () => (
  <WelcomePage />
);

export const Help = ({ setPageId }: { setPageId: string }) => (
  <Container>
    <Box textAlign="center" padding="xxl">
      <Header variant="h1">Help Center</Header>
    </Box>
  </Container>
);