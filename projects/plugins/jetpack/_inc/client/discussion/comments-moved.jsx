import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Comments settings to the panel in Features.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.getModule - Reads a module by slug.
 * @return {import('react').ReactNode} The card.
 */
export const CommentsMoved = ( { getModule } ) => (
	<PointerCard
		header={ __( 'Comments', 'jetpack' ) }
		href={ getModule( 'comments' )?.configure_url }
		linkText={ __( 'Open the Comments settings', 'jetpack' ) }
	>
		<p>{ __( 'The Comments settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
