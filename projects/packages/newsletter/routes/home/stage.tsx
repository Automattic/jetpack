import AdminPage from '@automattic/jetpack-components/admin-page';
import { getSiteData } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import './route.scss';

/**
 * Newsletter Mode "Dashboard" page.
 *
 * Placeholder chrome for now — the Jetpack header/footer and the white,
 * rounded content panel come from `AdminPage`, matching the unified Newsletter
 * page. Real content gets built on top of this shell.
 *
 * @return Stage content.
 */
const Stage = (): JSX.Element => (
	<AdminPage
		apiRoot={ getSiteData()?.rest_root }
		apiNonce={ getSiteData()?.rest_nonce }
		title={ __( 'Dashboard', 'jetpack-newsletter' ) }
		subTitle={ __( 'Your newsletter at a glance.', 'jetpack-newsletter' ) }
	>
		<div className="jetpack-newsletter-mode-page" />
	</AdminPage>
);

export { Stage as stage };
