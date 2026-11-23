import { getAdminUrl } from '@automattic/jetpack-script-data';
import { __, _x } from '@wordpress/i18n';
import PointerCard from 'components/pointer-card';
import { searchFindsPrivacy } from 'lib/settings-consolidation';

/**
 * Search result that sends the Privacy settings to the user's Profile page.
 *
 * @param {object} props            - Component props.
 * @param {string} props.searchTerm - The Settings search term.
 * @return {import('react').ReactNode} The card, while a search matches it.
 */
export const PrivacyMoved = ( { searchTerm } ) =>
	searchFindsPrivacy( searchTerm ) && (
		<PointerCard
			header={ _x( 'Privacy Settings', 'Settings header', 'jetpack' ) }
			href={ getAdminUrl( 'profile.php#jetpack-privacy' ) }
			linkText={ __( 'Open your Profile', 'jetpack' ) }
		>
			<p>
				{
					/* translators: "Users › Profile" is a WordPress admin menu path: use core's terms. */
					__(
						'The Jetpack privacy settings are now on your profile, in Users › Profile.',
						'jetpack'
					)
				}
			</p>
		</PointerCard>
	);
