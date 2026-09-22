import SettingsRoot from '../../_inc/client/settings-root';
import './route.scss';
import type { ComponentType } from 'react';

// settings-root.jsx's `@return {Element}` JSDoc resolves to the DOM type, not a React element.
const Root = SettingsRoot as unknown as ComponentType;

/**
 * Boot stage for Jetpack Settings. The container id matches the webpack page's.
 *
 * @return The Settings app.
 */
const Stage = () => (
	<div id="jp-plugin-container">
		<Root />
	</div>
);

export { Stage as stage };
