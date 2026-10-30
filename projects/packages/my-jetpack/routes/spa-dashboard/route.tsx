import { init } from '../../packages/init/src';

// The host page doesn't run My Jetpack's init module, so run it on first navigation here.
export const route = { beforeLoad: init };
