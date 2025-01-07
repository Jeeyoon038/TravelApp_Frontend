//GoogleProfile.tsx
import { useState, useEffect } from 'react';
import { GoogleLogin, GoogleCredentialResponse } from '@react-oauth/google';
import { useNavigate } from 'react-router-dom';

interface GoogleUser {
  googleId: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  photo: string;
}

const GoogleProfile: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const email = localStorage.getItem('user_email');
      const name = localStorage.getItem('user_name');
      const photo = localStorage.getItem('user_photo');

      console.log('GoogleProfile: Checking auth:', { email, name, photo });

      if (email && name && photo) {
        setUser({
          googleId: '',
          email,
          displayName: name,
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          photo
        });
        console.log('GoogleProfile: User authenticated');
      }
    };

    checkAuth();
    // Add event listener to check auth on storage changes
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLoginSuccess = (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      console.log('GoogleProfile: No credentials received');
      return;
    }
    console.log('GoogleProfile: Redirecting to auth endpoint');
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div className="flex items-center">
      {!user ? (
        <GoogleLogin 
          onSuccess={handleLoginSuccess}
          onError={(error:Error) => console.error('GoogleProfile: Login failed:', error)}
          useOneTap
        />
      ) : (
        <div className="flex items-center">
          <img
            src={user.photo}
            alt="Profile"
            className="w-10 h-10 rounded-full object-cover"
          />
          <span className="ml-2 font-medium text-sm">{user.displayName}</span>
        </div>
      )}
    </div>
  );
};

export default GoogleProfile;