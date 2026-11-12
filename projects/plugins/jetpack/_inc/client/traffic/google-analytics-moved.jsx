import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Google Analytics settings to the panel in Features.
 *
 * @return {import('react').ReactNode} The card.
 */
export const GoogleAnalyticsMoved = () => (
	<PointerCard
		header={ _x( 'Google Analytics', 'Settings header', 'jetpack' ) }
		href={ getAdminUrl( 'admin.php?page=my-jetpack&p=%2Ffeatures%3Fconfigure%3Dgoogle-analytics' ) }
		linkText={ __( 'Open the Google Analytics settings', 'jetpack' ) }
	>
		<p>{ __( 'The Google Analytics settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
