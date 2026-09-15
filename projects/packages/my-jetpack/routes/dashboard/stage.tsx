import App from '../../_inc/app';
import './route.scss';

/**
 * Boot stage for the My Jetpack dashboard.
 *
 * Renders the same tree as the legacy entry, `HashRouter` included — boot
 * reads its path from `?p=`, never the hash, so `#/…` deep links still resolve.
 *
 * @return The My Jetpack app.
 */
const Stage = () => <App />;

export { Stage as stage };
