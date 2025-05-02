import { Box, Container, Header } from '@cloudscape-design/components';

export const NotFound = () => (
  <Container>
    <Box textAlign="center" padding="xxl">
      <Header variant="h1">404 - Page Not Found</Header>
    </Box>
  </Container>
);

export const HomePage = () => (
  <Container>
    <Box textAlign="center" padding="xxl">
      <Header variant="h1">Welcome to Property Booking Assistant</Header>
    </Box>
  </Container>
);

export const Help = ({ setPageId }: { setPageId: string }) => (
  <Container>
    <Box textAlign="center" padding="xxl">
      <Header variant="h1">Help Center</Header>
    </Box>
  </Container>
); 