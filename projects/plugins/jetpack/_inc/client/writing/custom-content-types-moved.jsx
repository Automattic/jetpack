import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Testimonials and Portfolio settings to core's Settings › Writing.
 *
 * @return {import('react').ReactNode} The card.
 */
export const CustomContentTypesMoved = () => (
	<PointerCard
		header={ __( 'Custom content types', 'jetpack' ) }
		// The anchor is the id classic-theme-helper prints in its Writing section title.
		href={ getAdminUrl( 'options-writing.php#cpt-options' ) }
		linkText={ __( 'Open Settings › Writing', 'jetpack' ) }
	>
		<p>{ __( 'Testimonials and portfolio settings are now in Settings › Writing.', 'jetpack' ) }</p>
	</PointerCard>
);
