import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __ } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';

/**
 * Search result that sends the Post by Email settings to the panel in Features.
 *
 * @param {object}   props           - Component props.
 * @param {Function} props.getModule - Reads a module by slug.
 * @return {import('react').ReactNode} The card.
 */
export const PostByEmailMoved = ( { getModule } ) => (
	<PointerCard
		header={ __( 'Post by Email', 'jetpack' ) }
		href={ getModule( 'post-by-email' )?.configure_url }
		linkText={ __( 'Open the Post by Email settings', 'jetpack' ) }
	>
		<p>{ __( 'The Post by Email settings are now in Features, in My Jetpack.', 'jetpack' ) }</p>
	</PointerCard>
);

/**
 * Card that sends users who cannot manage modules to Post by Email on their Profile page.
 *
 * @return {import('react').ReactNode} The card.
 */
export const PostByEmailOnProfile = () => (
	<PointerCard
		module="post-by-email"
		header={ __( 'Post by Email', 'jetpack' ) }
		href={ getAdminUrl( 'profile.php#post-by-email' ) }
		linkText={ __( 'Open your profile', 'jetpack' ) }
	>
		<p>{ __( 'Set up your Post by Email address on your Profile page.', 'jetpack' ) }</p>
	</PointerCard>
);
