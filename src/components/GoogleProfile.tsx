// GoogleProfile.tsx
import { useState, useEffect } from 'react';
import ProfileImage, { UserProfile } from './ProfileImage';

interface GoogleUser extends UserProfile {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
}

const GoogleProfile: React.FC = () => {
  const [user, setUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const email = localStorage.getItem('user_email');
      const name = localStorage.getItem('user_name');
      const photo = localStorage.getItem('user_photo');

      if (email && name && photo) {
        setUser({
          googleId: '',
          email,
          displayName: name,
          firstName: name.split(' ')[0],
          lastName: name.split(' ')[1] || '',
          photo
        });
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  // You'll need to implement your own login component here
  // instead of using @react-oauth/google
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/auth/google';
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {!user ? (
        <button onClick={handleLogin}>
          Sign in with Google
        </button>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ProfileImage 
            user={user}
            size={48}
          />
          <span style={{ 
            marginLeft: '8px',
            fontSize: '14px',
            fontWeight: 500
          }}>
            {user.displayName}
          </span>
        </div>
      )}
    </div>
  );
};

export default GoogleProfile;