import AdminPage from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';

/**
 * wp-build stage for Settings > Sharing.
 *
 * @return The settings screen.
 */
const Stage = () => (
	<AdminPage title={ __( 'Sharing Settings', 'jetpack-sharing-likes' ) }>{ null }</AdminPage>
);

export { Stage as stage };
