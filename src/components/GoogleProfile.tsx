import { useEffect, useState } from 'react';
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
      const googleId = localStorage.getItem('user_google_id');
      const email = localStorage.getItem('user_email');
      const name = localStorage.getItem('user_name');
      const photo = localStorage.getItem('user_photo');

      if (googleId && email && name && photo) {
        const nameParts = name.split(' ');
        setUser({
          googleId,
          email,
          displayName: name,
          firstName: nameParts[0],
          lastName: nameParts[1] || '',
          photo
        });
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL;
    window.location.href = `${apiUrl}/auth/google`;
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