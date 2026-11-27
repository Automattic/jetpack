import { __ } from '@wordpress/i18n';
import DocumentHead from '../../../compat/components/document-head';
import config from '../../../compat/config';
import BlazePage from '../../../promote-post-i2/components/blaze-page';
import BlazePageViewTracker from '../../../promote-post-i2/components/blaze-page-view-tracker';
import MainWrapper from '../../../promote-post-i2/components/main-wrapper';
import { getAdvertisingDashboardPath } from '../../../promote-post-i2/utils';
import BlazeDisabled from './components/blaze-disabled';
import DisconnectedSite from './components/disconnected-site';
import IneligibleSite from './components/ineligible-site';
import PrivateSite from './components/private-site';
import './style.scss';

const renderSetupComponent = setupInfo => {
	// Compatibility with previous Jetpack's version
	const reason = typeof setupInfo === 'boolean' ? 'blaze_disabled' : setupInfo;

	switch ( reason ) {
		case 'blaze_disabled':
			return <BlazeDisabled />;
		case 'site_private_or_coming_soon':
			return <PrivateSite />;
		case 'disconnected':
			return <DisconnectedSite />;
		case 'site_ineligible':
			return <IneligibleSite />;
		default:
			return <BlazeDisabled />;
	}
};

/**
 *
 * @param root0
 * @param root0.setupInfo
 */
export default function BlazeSetup( { setupInfo } ) {
	const isBlazePlugin = config.isEnabled( 'is_running_in_blaze_plugin' );

	const documentTitle = isBlazePlugin ? 'Blaze Ads' : __( 'Advertising', 'jetpack-blaze' );

	return (
		<MainWrapper>
			<DocumentHead title={ documentTitle } />
			<BlazePageViewTracker
				path={ getAdvertisingDashboardPath( '/setup/:site' ) }
				title="Advertising > Setup"
			/>

			<BlazePage>
				<div className="promote-post-i2__outer-wrapper">{ renderSetupComponent( setupInfo ) }</div>
			</BlazePage>
		</MainWrapper>
	);
}
