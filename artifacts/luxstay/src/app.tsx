import { useState, useEffect } from "react";
import { Routes, Route, HashRouter, useNavigate, Navigate } from 'react-router-dom';
import { AppLayout, TopNavigation, SideNavigation, Alert } from '@cloudscape-design/components';
import { Hub } from 'aws-amplify/utils';
import { signOut } from 'aws-amplify/auth';
import { AppContext } from "./common/context";
import { NotFound, HomePage, Help } from './pages'
import PropertySearchPage from './pages/PropertySearchPage';
import ManagePropertiesPage from './pages/ManagePropertiesPage';
import SignIn from './components/SignIn';
import '@aws-amplify/ui-react/styles.css';
import WelcomePage from './components/WelcomePage';
import PropertyForm from './components/PropertyForm';
import PropertySearch from './components/PropertySearch';
import { AuthHelper } from "./common/helpers/auth-help";
import UserBookings from './components/UserBookings';
import CustomerSupport from './components/CustomerSupport';
import Reviews from './components/Reviews';

// Create a wrapper component to handle navigation after logout
const LogoutHandler = () => {
  const navigate = useNavigate();
  
  useEffect(() => {
    const handleLogout = async () => {
      try {
        await signOut({ global: true });
        console.log("Sign out successful");
        // Navigate to home page after logout
        navigate('/');
      } catch (err) {
        console.error("Error signing out:", err);
        // Still navigate to home even if there's an error
        navigate('/');
      }
    };
    
    handleLogout();
  }, [navigate]);
  
  return <div style={{ padding: '20px', textAlign: 'center' }}>Signing out...</div>;
};

export default function App() {
  const [activeHref, setActiveHref] = useState("#/");
  const [utility, setUtility] = useState([]);
  const [notificationVisible, setNotificationVisible] = useState(false);
  const [appData, setAppData] = useState({ userinfo: null });
  const [notificationMsg, setNotificationMsg] = useState("");
  const Router = HashRouter;

  // Initialize auth state on component mount
  useEffect(() => {
    const checkAuthState = async () => {
      try {
        const userdata = await AuthHelper.getUserDetails();
        setAppData({
          userinfo: userdata
        });
      } catch (error) {
        console.log("User not authenticated:", error);
        setAppData({ userinfo: null });
      }
    };
    
    checkAuthState();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const authListener = Hub.listen("auth", async (data) => {
      switch (data.payload.event) {
        case "signedOut":
          console.log("User signed out");
          setAppData({ userinfo: null });
          break;
        case "signedIn":
          console.log("User signed in");
          try {
            const userdata = await AuthHelper.getUserDetails();
            setAppData({
              userinfo: userdata
            });
          } catch (error) {
            console.error("Error getting user details:", error);
          }
          break;
      }
    });

    return () => {
      authListener();
    };
  }, []);

  // Update utility menu based on auth state
  useEffect(() => {
    if (appData.userinfo != null) {
      const loginId = appData.userinfo.signInDetails?.loginId || appData.userinfo.username || 'User';
      setUtility([
        {
          type: "menu-dropdown",
          text: "Profile",
          description: loginId,
          iconName: "user-profile",
          onItemClick: (e) => {
            if (e.detail.id === 'signout') {
              // Navigate to logout route instead of directly calling signOut
              window.location.hash = "#/logout";
            }
          },
          items: [
            { id: "signout", text: "Sign out" }
          ]
        }
      ]);
    } else {
      setUtility([
        {
          type: "button",
          text: "Sign In",
          href: "#/signin",
          variant: "primary-button"
        }
      ]);
    }
  }, [appData]);

  return (
    <AppContext.Provider value={appData}>
    <div id="custom-main-header" style={{ position: 'sticky', top: 0, zIndex: 1002 }}>
      <TopNavigation
        identity={{
          href: '#',
          title: 'Luxstay',
        }}
        utilities={[
          {
            type: "button",
            text: "Github",
            href: "https://github.com/Fraser27/booking-app-demo",
            external: true,
            externalIconAriaLabel: " (opens in a new tab)"
          },
          ...utility
        ]}
      />
    </div>
    <AppLayout
      disableContentPaddings
      headerSelector='#custom-main-header'
      toolsHide={false}
      toolsOpen={false}
      tools={
        <Router>
          <Routes>
            <Route path="/" element={<Help setPageId="home" />} />
            <Route path="*" element={<Help setPageId="404" />} />
          </Routes>
        </Router>
      }
      notifications={(notificationVisible) ? <Alert dismissible statusIconAriaLabel="Warning" type="warning" onDismiss={() => setNotificationVisible(false)}>{notificationMsg}</Alert> : ""}
      navigation={<SideNavigation
        activeHref={activeHref}
        header={{ href: "#/", text: "Property Booking" }}
        onFollow={event => {
          if (!event.detail.external) {
            setActiveHref(event.detail.href);
          }
        }}
        items={[
          {
            type: "link-group", text: "Property Search", href: "#/property-search",
            items: [
              { type: "link", text: "Manage Properties", href: "#/property-search/manage" },
            ]
          },
          { type: "link", text: "Bookings", href: "#/bookings" },
          { type: "link", text: "Reviews", href: "#/reviews" },
          { type: "link", text: "Customer Support", href: "#/support" },
        ]}
      />}
      content={
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/logout" element={<LogoutHandler />} />
            <Route path="/property-search" element={<PropertySearchPage />} />
            <Route path="/property-search/manage" element={<ManagePropertiesPage />} />
            <Route path="/bookings" element={<UserBookings />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/support" element={<CustomerSupport />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
      }
    />
    </AppContext.Provider>
  );
}