import App from '../../_inc/app';
import './route.scss';

/**
 * Boot stage for the My Jetpack dashboard.
 *
 * Keeps the app's `HashRouter` — boot reads its path from `?p=`, never the
 * hash, so `#/…` deep links still resolve.
 *
 * @return The My Jetpack app.
 */
const Stage = () => <App />;

export { Stage as stage };
