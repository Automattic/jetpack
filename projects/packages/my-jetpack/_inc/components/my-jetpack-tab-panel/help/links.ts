import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';

type HelpLinks = {
	isWpcomSupport: boolean;
	documentation: string;
	contactSupport: string;
	developers: string | null;
};

/**
 * Get the Help tab destinations for whoever supports this site.
 *
 * @return The support channel and its URLs; `developers` is null where the card is not offered.
 */
export function getHelpLinks(): HelpLinks {
	if ( isWpcomPlatformSite() ) {
		return {
			isWpcomSupport: true,
			documentation: 'https://wordpress.com/support/',
			contactSupport: 'https://wordpress.com/help/contact',
			developers: null,
		};
	}

	return {
		isWpcomSupport: false,
		documentation: getRedirectUrl( 'jetpack-support' ),
		contactSupport: getRedirectUrl( 'jetpack-contact-support' ),
		developers: getRedirectUrl( 'jetpack-for-developers' ),
	};
}
