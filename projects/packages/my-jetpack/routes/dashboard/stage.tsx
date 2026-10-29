import App from '../../_inc/app';
import { showFeatureDetailsInInspector } from '../../_inc/components/my-jetpack-tab-panel/features/feature-inspector';
import './route.scss';

showFeatureDetailsInInspector();

/**
 * Boot stage for the My Jetpack dashboard.
 *
 * The boot router owns the URL; `route.tsx` redirects `#/…` links from before it.
 *
 * @return The My Jetpack app.
 */
const Stage = () => <App />;

export { Stage as stage };
