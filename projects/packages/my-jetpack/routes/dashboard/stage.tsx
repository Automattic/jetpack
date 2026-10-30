import App from '../../_inc/app';
import './route.scss';

/**
 * Boot stage for the My Jetpack dashboard.
 *
 * The boot router owns the URL; `route.tsx` redirects `#/…` links from before it.
 *
 * @return The My Jetpack app.
 */
const Stage = () => <App />;

export { Stage as stage };
