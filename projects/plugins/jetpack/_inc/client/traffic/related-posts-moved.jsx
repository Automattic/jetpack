import { __ } from '@wordpress/i18n';
import { PointerCard } from 'components/pointer-card';

/**
 * Search result that sends the Related Posts settings to the panel in Features.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.getModule - Reads a module by slug.
 * @return {import('react').ReactNode} The card.
 */
export const RelatedPostsMoved = ( { getModule } ) => (
	<PointerCard
		header={ __( 'Related posts', 'jetpack' ) }
		href={ getModule( 'related-posts' )?.configure_url }
		linkText={ __( 'Open the Related posts settings', 'jetpack' ) }
	>
		<p>{ __( 'The Related posts settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
