import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Infinite Scroll settings to the panel in Features.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.getModule - Reads a module by slug.
 * @return {import('react').ReactNode} The card.
 */
export const InfiniteScrollMoved = ( { getModule } ) => (
	<PointerCard
		header={ __( 'Infinite Scroll', 'jetpack' ) }
		href={ getModule( 'infinite-scroll' )?.configure_url }
		linkText={ __( 'Open the Infinite Scroll settings', 'jetpack' ) }
	>
		<p>{ __( 'The Infinite Scroll settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
