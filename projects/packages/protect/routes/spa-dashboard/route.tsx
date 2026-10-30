import { init } from '../../packages/init/src';
import { route as dashboardRoute } from '../dashboard/route';

// The host page doesn't run Protect's init module, so run it on first navigation here.
export const route = { ...dashboardRoute, beforeLoad: init };
