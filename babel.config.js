module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // Lets Drizzle's generated .sql migration files be imported as strings.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
