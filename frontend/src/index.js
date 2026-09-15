import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Auth0Provider } from '@auth0/auth0-react';
import './index.css';
import App from './App';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Terms from './pages/Terms';
import CareerPathLayout from './student/CareerPathLayout';
import { CareerPathProfile } from './student/CareerPathProfile';
import { CareerPathOpportunities } from './student/CareerPathOpportunities';
import { CareerPathApplications } from './student/CareerPathApplications';
import { CareerPathSkills } from './student/CareerPathSkills';
import { CareerPathAssistant } from './student/CareerPathAssistant';
import { CareerPathDashboard } from './student/CareerPathDashboard';

const AUTH0_DOMAIN = process.env.REACT_APP_AUTH0_DOMAIN || 'dev-shjk32vx4oscfrde.us.auth0.com';
const AUTH0_CLIENT_ID = process.env.REACT_APP_AUTH0_CLIENT_ID || 'KHC4ncaBYv0W4NqgVSLD5vJI8SuqPHDk';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Auth0Provider
      domain={AUTH0_DOMAIN}
      clientId={AUTH0_CLIENT_ID}
      authorizationParams={{
        redirect_uri: window.location.origin
      }}
      cacheLocation="localstorage"
      useRefreshTokens={false}
    >
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/callback" element={<App />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />

          {/* CareerPath Student Platform Routes */}
          <Route path="/dashboard" element={<CareerPathLayout><CareerPathDashboard /></CareerPathLayout>} />
          <Route path="/student/dashboard" element={<CareerPathLayout><CareerPathDashboard /></CareerPathLayout>} />
          <Route path="/opportunities" element={<CareerPathLayout><CareerPathOpportunities /></CareerPathLayout>} />
          <Route path="/student/opportunities" element={<CareerPathLayout><CareerPathOpportunities /></CareerPathLayout>} />
          <Route path="/applications" element={<CareerPathLayout><CareerPathApplications /></CareerPathLayout>} />
          <Route path="/student/applications" element={<CareerPathLayout><CareerPathApplications /></CareerPathLayout>} />
          <Route path="/skills" element={<CareerPathLayout><CareerPathSkills /></CareerPathLayout>} />
          <Route path="/student/skills" element={<CareerPathLayout><CareerPathSkills /></CareerPathLayout>} />
          <Route path="/assistant" element={<CareerPathLayout><CareerPathAssistant /></CareerPathLayout>} />
          <Route path="/student/assistant" element={<CareerPathLayout><CareerPathAssistant /></CareerPathLayout>} />
          <Route path="/profile" element={<CareerPathLayout><CareerPathProfile /></CareerPathLayout>} />
          <Route path="/student/profile" element={<CareerPathLayout><CareerPathProfile /></CareerPathLayout>} />
        </Routes>
      </BrowserRouter>
    </Auth0Provider>
  </React.StrictMode>
);
