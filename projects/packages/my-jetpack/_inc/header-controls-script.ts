/**
 * Exposes the shared header's controls to dashboards built outside My Jetpack, such as Boost's.
 *
 * A webpack script, so `@automattic/jetpack-connection` resolves to the page's shared copy instead of a second bundled one.
 */
import { getHeaderControls } from './components/header-controls';

window.myJetpackHeaderControls = { getHeaderControls };
