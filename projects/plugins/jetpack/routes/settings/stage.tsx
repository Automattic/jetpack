import SettingsRoot from '../../_inc/client/settings-root';
// esbuild takes social-previews' dist/ JS, which leaves out its CSS; webpack compiles it from source.
import '@automattic/social-previews/style.css';
import './route.scss';

/**
 * Boot stage for Jetpack Settings. PHP-rendered pages style the same container id.
 *
 * @return The Settings app.
 */
const Stage = () => (
	<div id="jp-plugin-container">
		<SettingsRoot />
	</div>
);

export { Stage as stage };
