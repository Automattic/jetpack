import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Carousel settings to the panel in Features.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.getModule - Reads a module by slug.
 * @return {import('react').ReactNode} The card.
 */
export const CarouselMoved = ( { getModule } ) => (
	<PointerCard
		header={ __( 'Carousel', 'jetpack' ) }
		href={ getModule( 'carousel' )?.configure_url }
		linkText={ __( 'Open the Carousel settings', 'jetpack' ) }
	>
		<p>{ __( 'The Carousel settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
