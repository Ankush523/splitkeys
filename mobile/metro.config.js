const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '..');
const engine = path.resolve(workspaceRoot, 'engine');

module.exports = mergeConfig(getDefaultConfig(projectRoot), {
  watchFolders: [engine, workspaceRoot],
  // npm workspaces hoist deps to the repo root; Metro must resolve both.
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
});
