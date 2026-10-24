// scripts/patch-react.js
// Automatically patch React 19 to export __SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED for Zoom Meeting SDK
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const prodPath = path.join(rootDir, 'node_modules/react/cjs/react.production.js');
const devPath = path.join(rootDir, 'node_modules/react/cjs/react.development.js');

const patchCode = `exports.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED = {
  ReactCurrentOwner: ReactSharedInternals.A || { current: null },
  ReactCurrentDispatcher: ReactSharedInternals.H || { current: null },
  ReactCurrentBatchConfig: ReactSharedInternals.T || { transition: null },
  ReactCurrentActQueue: ReactSharedInternals.S || { current: null },
};`;

function patchFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let code = fs.readFileSync(filePath, 'utf8');
  if (code.includes('__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED')) {
    console.log(`[patch-react] Already patched: ${filePath}`);
    return;
  }
  const target = 'exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =\n  ReactSharedInternals;';
  const targetDev = 'exports.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE =\n      ReactSharedInternals;';
  
  if (code.includes(target)) {
    code = code.replace(target, `${target}\n${patchCode}`);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[patch-react] Patched: ${filePath}`);
  } else if (code.includes(targetDev)) {
    code = code.replace(targetDev, `${targetDev}\n${patchCode}`);
    fs.writeFileSync(filePath, code, 'utf8');
    console.log(`[patch-react] Patched: ${filePath}`);
  }
}

try {
  patchFile(prodPath);
  patchFile(devPath);
} catch (e) {
  console.error('[patch-react] Warning: could not patch react files:', e.message);
}
