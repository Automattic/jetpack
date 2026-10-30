import { init } from '../../packages/init/src';

// The host page doesn't run Activity Log's init module, so load its catalogs on first navigation here.
export const route = { beforeLoad: init };
