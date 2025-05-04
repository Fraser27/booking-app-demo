import { Authenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Hub } from 'aws-amplify/utils';
import { AuthHelper } from '../common/helpers/auth-help';

const SignIn = () => {
  const navigate = useNavigate();

  // Listen for auth events
  useEffect(() => {
    const handleAuthEvents = async (data: any) => {
      switch (data.payload.event) {
        case 'signedIn':
          // Get user details and then navigate
          try {
            await AuthHelper.getUserDetails();
            navigate('/');
          } catch (error) {
            console.error('Error getting user details:', error);
          }
          break;
      }
    };

    const hubListener = Hub.listen('auth', handleAuthEvents);

    // Cleanup listener on component unmount
    return () => {
      hubListener();
    };
  }, [navigate]);

  return (
    <Authenticator
      loginMechanisms={['email']}
      signUpAttributes={['email', 'name']}
      components={{
        Header() {
          return (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <h1>Welcome to Luxstay</h1>
              <p>Sign in to your account</p>
            </div>
          );
        },
      }}
    >
      {({ signOut, user }) => {
        // This function is called after successful authentication
        // We'll handle navigation in the useEffect hook instead
        return (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <h2>Welcome, {user?.username || 'User'}!</h2>
            <p>You are now signed in. Redirecting to home page...</p>
          </div>
        );
      }}
    </Authenticator>
  );
};

export default SignIn;