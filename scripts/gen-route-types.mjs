/**
 * Regenerates expo-router's typed routes (.expo/types/router.d.ts) without
 * starting Metro. Metro normally writes them on a bundle request; run this
 * after adding or renaming a route so `npm run typecheck` sees it.
 *
 *   npm run gen:routes
 */
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
// Read when the generator loads, so it must be set before the require below.
process.env.EXPO_ROUTER_APP_ROOT = path.resolve('app');
// The generator ships inside @expo/cli, which ships inside expo.
const cli = path.dirname(
  require.resolve('@expo/cli/package.json', { paths: [path.dirname(require.resolve('expo'))] }),
);
const generator = require(
  require.resolve('@expo/router-server/build/typed-routes', { paths: [cli] }),
);

generator.regenerateDeclarations(path.resolve('.expo/types'), {});
console.log('wrote .expo/types/router.d.ts');
