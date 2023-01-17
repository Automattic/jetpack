const FLOWS = {
	NEWSLETTER: 'newsletter',
	LINK_IN_BIO: 'link-in-bio',
	FREE: 'free',
	VIDEOPRESS: 'videopress',
};

export function isModalSupportedByFlow( flow ) {
	return Object.values( FLOWS ).includes( flow );
}
