// File: babel.config.js
module.exports = function(api) {
    api.cache(true);
    return {
      presets: ['babel-preset-expo'],
      // Add plugins array HERE if needed
      plugins: [
         // Reanimated plugin needs to be LAST if added later
      ],
    };
  };