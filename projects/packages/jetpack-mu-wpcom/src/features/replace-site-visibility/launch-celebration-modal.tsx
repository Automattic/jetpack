import { useEffect, useState } from 'react';
import CelebrateLaunchModal from '../../common/celebrate-launch/celebrate-launch-modal';
import {
	CELEBRATE_LAUNCH_PARAM,
	withoutCelebrateLaunchParam,
} from '../../common/celebrate-launch/celebrate-launch-url';

interface Props {
	siteDomain: string;
	homeUrl: string;
	sitePlan?: { product_slug: string };
	hasCustomDomain: boolean;
}

const LaunchCelebrationModal = ( { siteDomain, homeUrl, sitePlan, hasCustomDomain }: Props ) => {
	const [ showCelebrateLaunchModal, setShowCelebrateLaunchModal ] = useState( () =>
		new URL( window.location.href ).searchParams.has( CELEBRATE_LAUNCH_PARAM )
	);

	// Strip the param on mount so the celebration shows exactly once. This lives on
	// the Reading settings page, whose form redirects back to its _wp_http_referer
	// after every save; that hidden field captured the param on page load, so unless
	// we clean it too each save would re-open this modal.
	useEffect( () => {
		const cleanedHref = withoutCelebrateLaunchParam( window.location.href );
		if ( cleanedHref !== window.location.href ) {
			window.history.replaceState( null, '', cleanedHref );
		}

		document
			.querySelectorAll< HTMLInputElement >( 'input[name="_wp_http_referer"]' )
			.forEach( field => {
				field.value = withoutCelebrateLaunchParam( field.value );
			} );
	}, [] );

	if ( ! showCelebrateLaunchModal ) {
		return null;
	}

	return (
		<CelebrateLaunchModal
			siteDomain={ siteDomain }
			siteUrl={ homeUrl }
			sitePlan={ sitePlan }
			hasCustomDomain={ hasCustomDomain }
			onRequestClose={ () => setShowCelebrateLaunchModal( false ) }
		/>
	);
};

export default LaunchCelebrationModal;
