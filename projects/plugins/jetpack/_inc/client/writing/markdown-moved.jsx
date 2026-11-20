import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Markdown settings to the panel in Features.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.getModule - Reads a module by slug.
 * @return {import('react').ReactNode} The card.
 */
export const MarkdownMoved = ( { getModule } ) => (
	<PointerCard
		header={ __( 'Markdown', 'jetpack' ) }
		href={ getModule( 'markdown' )?.configure_url }
		linkText={ __( 'Open the Markdown settings', 'jetpack' ) }
	>
		<p>{ __( 'The Markdown settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);
