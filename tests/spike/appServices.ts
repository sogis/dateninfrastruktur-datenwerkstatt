// Static imports let Vite resolve the same cache-busted singleton as the app.
// Browser tests load this harness instead of dynamically importing an unversioned source URL.
export {initializeServices, services} from '../../src/app/services';
