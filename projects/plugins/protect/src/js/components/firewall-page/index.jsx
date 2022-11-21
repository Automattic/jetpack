import { AdminPage } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import Logo from '../logo';

const FirewallPage = () => (
	<AdminPage moduleName={ __( 'Jetpack Protect', 'jetpack-protect' ) } header={ <Logo /> } />
);

export default FirewallPage;
