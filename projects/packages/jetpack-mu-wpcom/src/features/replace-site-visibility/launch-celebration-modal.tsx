import { useState } from 'react';
import CelebrateLaunchModal from '../../common/celebrate-launch/celebrate-launch-modal';

interface Props {
	siteDomain: string;
	homeUrl: string;
	sitePlan?: { product_slug: string };
	hasCustomDomain: boolean;
}

const LaunchCelebrationModal = ( { siteDomain, homeUrl, sitePlan, hasCustomDomain }: Props ) => {
	const [ showCelebrateLaunchModal, setShowCelebrateLaunchModal ] = useState( () => {
		const url = new URL( window.location.href );
		return url.searchParams.has( 'celebrate-launch' );
	} );

	if ( ! showCelebrateLaunchModal ) {
		return null;
	}

	return (
		<CelebrateLaunchModal
			siteDomain={ siteDomain }
			siteUrl={ homeUrl }
			sitePlan={ sitePlan }
			hasCustomDomain={ hasCustomDomain }
			onRequestClose={ () => {
				setShowCelebrateLaunchModal( false );
				const url = new URL( window.location.href );
				url.searchParams.delete( 'celebrate-launch' );
				window.history.replaceState( null, '', url.toString() );
			} }
		/>
	);
};

export default LaunchCelebrationModal;
