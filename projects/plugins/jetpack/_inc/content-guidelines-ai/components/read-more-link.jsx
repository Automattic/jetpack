import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { ExternalLink } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	GUIDELINES_SUPPORT_REDIRECT_JETPACK,
	GUIDELINES_SUPPORT_REDIRECT_WPCOM,
} from '../constants';
import { recordGuidelinesEvent } from '../lib/tracks';

export default function ReadMoreLink() {
	const handleClick = useCallback( () => {
		recordGuidelinesEvent( 'read_more_click' );
	}, [] );

	// Same platform split as the editor's Stripe nudge: wpcom platform sites
	// (Simple and Atomic) read the wordpress.com support docs, self-hosted
	// sites the jetpack.com ones.
	const href = isWpcomPlatformSite()
		? getRedirectUrl( GUIDELINES_SUPPORT_REDIRECT_WPCOM )
		: getRedirectUrl( GUIDELINES_SUPPORT_REDIRECT_JETPACK );

	return (
		<ExternalLink href={ href } onClick={ handleClick }>
			{ __( 'Read more', 'jetpack' ) }
		</ExternalLink>
	);
}
