const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Drizzle migrations ship as .sql files that are imported directly.
config.resolver.sourceExts.push('sql');

module.exports = config;
