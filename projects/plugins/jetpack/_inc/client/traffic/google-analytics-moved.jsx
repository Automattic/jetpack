import { __, _x } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Google Analytics settings to the panel in Features.
 *
 * @param {object} props      - Component props.
 * @param {string} props.href - The panel URL, from My Jetpack.
 * @return {import('react').ReactNode} The card.
 */
export const GoogleAnalyticsMoved = ( { href } ) => (
	<PointerCard
		header={ _x( 'Google Analytics', 'Settings header', 'jetpack' ) }
		href={ href }
		linkText={ __( 'Open the Google Analytics settings', 'jetpack' ) }
	>
		<p>{ __( 'The Google Analytics settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
