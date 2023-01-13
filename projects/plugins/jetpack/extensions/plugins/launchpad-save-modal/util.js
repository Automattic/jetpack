import { __ } from '@wordpress/i18n';

const FLOWS = {
	NEWSLETTER: 'newsletter',
	LINK_IN_BIO: 'link-in-bio',
	FREE: 'free',
	VIDEOPRESS: 'videopress',
};

export function isModalSupportedByFlow( flow ) {
	return Object.values( FLOWS ).includes( flow );
}

export function getModalContentFromFlow( flow ) {
	switch ( flow ) {
		case FLOWS.NEWSLETTER:
			return {
				heading: __( 'Finish your Newsletter setup!', 'jetpack' ),
				body: __( 'You are just moments away from growing your audience.', 'jetpack' ),
			};
		case FLOWS.LINK_IN_BIO:
			return {
				heading: __( 'Your site is ready to launch!', 'jetpack' ),
				body: __(
					'Launching your Link in Bio will allow you to share a link with others and promote your site.',
					'jetpack'
				),
			};
		case FLOWS.FREE:
		case FLOWS.VIDEOPRESS:
			return {
				heading: __( 'Your site is ready to launch!', 'jetpack' ),
				body: __( 'Bring your new site to life by launching it.', 'jetpack' ),
			};
		default:
			return null;
	}
}
