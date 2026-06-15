/**
 * Root App component — screen routing.
 *
 * Reads `window.JetpackBeta.plugin` to decide which screen to render:
 * - null  → PluginList wrapped in AdminPage (all plugins overview)
 * - string → PluginManage (single-plugin manage view, owns its own AdminPage so it can supply a breadcrumb once the plugin name is known)
 *
 * @package
 */

import { AdminPage, JetpackFooter } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PluginList from './screens/plugin-list';
import PluginManage from './screens/plugin-manage';

const boot = window.JetpackBeta;

/**
 * App component.
 *
 * @return The active screen, wrapped in AdminPage where appropriate.
 */
const App = () => {
	const plugin = boot.plugin;

	// The manage screen owns its own AdminPage so it can inject a breadcrumb
	// once it knows the plugin name (fetched asynchronously).
	if ( plugin !== null ) {
		return <PluginManage slug={ plugin } />;
	}

	return (
		<AdminPage
			title="Beta Tester"
			subTitle={ __( 'Test beta features and pull requests for Jetpack plugins.', 'jetpack-beta' ) }
			apiRoot={ boot.apiRoot }
			apiNonce={ boot.apiNonce }
			showFooter={ false }
			unwrapped
		>
			<PluginList />
			<JetpackFooter showDefaultLinks={ false } />
		</AdminPage>
	);
};

export default App;
