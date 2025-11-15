import React from 'react';

// HD Minecraft Background Images from Unsplash/Pexels
const backgroundImages = {
  home: 'https://images.unsplash.com/photo-1625805866449-3589fe3f71a3?w=1920&q=80', // Minecraft landscape
  profile: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=1920&q=80', // Minecraft village
  admin: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1920&q=80', // Minecraft blocks
  deposit: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1920&q=80', // Minecraft creative
  default: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1920&q=80' // Minecraft world
};

function MinecraftBackground({ imageSrc = 'default' }) {
  // Get image URL based on page
  const imageUrl = backgroundImages[imageSrc] || backgroundImages.default;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        overflow: 'hidden',
      }}
    >
      {/* HD Minecraft Image Background */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url(${imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          pointerEvents: 'none',
        }}
      />

      {/* Animated overlay for depth effect */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.6) 0%, rgba(0, 0, 0, 0.4) 100%)',
          pointerEvents: 'none',
          animation: 'fadeIn 1s ease-in',
        }}
      />
    </div>
  );
}

export default MinecraftBackground;
