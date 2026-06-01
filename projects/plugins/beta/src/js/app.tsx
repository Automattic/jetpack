/**
 * Root App component — AdminPage shell with screen routing.
 *
 * Reads `window.JetpackBeta.plugin` to decide which screen to render:
 * - null  → PluginList (all plugins overview)
 * - string → PluginManage (single-plugin manage view)
 *
 * @package
 */

import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PluginList from './screens/plugin-list';
import PluginManage from './screens/plugin-manage';

const boot = window.JetpackBeta;

/**
 * App component.
 *
 * @return The AdminPage shell with the active screen.
 */
const App = () => {
	const plugin = boot.plugin;

	return (
		<AdminPage
			title="Beta Tester"
			subTitle={ __( 'Test beta features and pull requests for Jetpack plugins.', 'jetpack-beta' ) }
			apiRoot={ boot.apiRoot }
			apiNonce={ boot.apiNonce }
		>
			{ plugin === null ? <PluginList /> : <PluginManage slug={ plugin } /> }
		</AdminPage>
	);
};

export default App;
