// ProfileImage.tsx
import React from 'react';

export interface UserProfile {
  displayName: string;
  photo: string;
}

interface ProfileImageProps {
  user: UserProfile | null;
  size?: number;
  onClick?: () => void;
}

const ProfileImage: React.FC<ProfileImageProps> = ({ 
  user, 
  size = 45,
  onClick 
}) => {
  // Container style with enforced circular shape
  const containerStyle: React.CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: '50%',
    overflow: 'hidden',
    cursor: user && onClick ? 'pointer' : 'default',
    backgroundColor: '#f0f0f0', // Fallback background color
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0  // Prevent container from shrinking
  };

  // Image style also with circular shape
  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%',  // Added borderRadius here as well
    display: 'block'  // Remove any potential inline spacing
  };

  if (!user?.photo) {
    return null;
  }

  return (
    <div style={containerStyle} onClick={onClick}>
      <img
        src={user.photo}
        alt={user.displayName}
        style={imageStyle}
      />
    </div>
  );
};

export default ProfileImage;