import { LocaleProvider } from '@automattic/i18n-utils';
import { Guide, GuidePage } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { applyFilters } from '@wordpress/hooks';
import { registerPlugin } from '@wordpress/plugins';
import { getQueryArg } from '@wordpress/url';
import { useCanvasMode } from '../../../common/hooks';
import {
	HasSeenSellerCelebrationModalProvider,
	HasSeenVideoCelebrationModalProvider,
	ShouldShowFirstPostPublishedModalProvider,
} from '../../../common/tour-kit';
import { BloggingPromptsModal } from './blogging-prompts-modal';
import DraftPostModal from './draft-post-modal';
import FirstPostPublishedModal from './first-post-published-modal';
import PurchaseNotice from './purchase-notice';
import RecommendedTagsModal from './recommended-tags-modal';
import SellerCelebrationModal from './seller-celebration-modal';
import { DEFAULT_VARIANT, BLANK_CANVAS_VARIANT } from './store';
import VideoPressCelebrationModal from './video-celebration-modal';
import WpcomNux from './welcome-modal/wpcom-nux';
import LaunchWpcomWelcomeTour from './welcome-tour/tour-launch';

/**
 * The WelcomeTour component
 * @return {JSX.Element|null} The WelcomeTour component or null.
 */
function WelcomeTour() {
	const [ showDraftPostModal ] = useState(
		getQueryArg( window.location.href, 'showDraftPostModal' )
	);

	const { show, isLoaded, variant, isManuallyOpened, isNewPageLayoutModalOpen } = useSelect(
		select => {
			const welcomeGuideStoreSelect = select( 'automattic/wpcom-welcome-guide' );
			const starterPageLayoutsStoreSelect = select( 'automattic/starter-page-layouts' );

			return {
				show: welcomeGuideStoreSelect.isWelcomeGuideShown(),
				isLoaded: welcomeGuideStoreSelect.isWelcomeGuideStatusLoaded(),
				variant: welcomeGuideStoreSelect.getWelcomeGuideVariant(),
				isManuallyOpened: welcomeGuideStoreSelect.isWelcomeGuideManuallyOpened(),
				isNewPageLayoutModalOpen: starterPageLayoutsStoreSelect?.isOpen(), // Handle the case where SPT is not initalized.
			};
		},
		[]
	);

	const siteEditorCanvasMode = useCanvasMode();

	const setOpenState = useDispatch( 'automattic/starter-page-layouts' )?.setOpenState;

	const { fetchWelcomeGuideStatus } = useDispatch( 'automattic/wpcom-welcome-guide' );

	// On mount check if the WPCOM welcome guide status exists in state (from local storage), otherwise fetch it from the API.
	useEffect( () => {
		if ( ! isLoaded ) {
			fetchWelcomeGuideStatus();
		}
	}, [ fetchWelcomeGuideStatus, isLoaded ] );

	const filteredShow = applyFilters( 'a8c.WpcomBlockEditorWelcomeTour.show', show );

	if ( ! filteredShow || isNewPageLayoutModalOpen ) {
		return null;
	}

	// Hide the Welcome Tour when not in the edit mode. Note that canvas mode is available only in the site editor
	if ( siteEditorCanvasMode && siteEditorCanvasMode !== 'edit' ) {
		return null;
	}

	// Open patterns panel before Welcome Tour if necessary (e.g. when using Blank Canvas theme)
	// Do this only when Welcome Tour is not manually opened.
	// NOTE: at the moment, 'starter-page-templates' assets are not loaded on /site-editor/ page so 'setOpenState' may be undefined
	if ( variant === BLANK_CANVAS_VARIANT && ! isManuallyOpened && setOpenState ) {
		setOpenState( 'OPEN_FOR_BLANK_CANVAS' );
		return null;
	}

	if ( variant === DEFAULT_VARIANT ) {
		return (
			<LocaleProvider>
				{ showDraftPostModal ? <DraftPostModal /> : <LaunchWpcomWelcomeTour /> }
			</LocaleProvider>
		);
	}

	// This case is redundant now and it will be cleaned up in a follow-up PR
	if ( variant === 'modal' && Guide && GuidePage ) {
		return <WpcomNux />;
	}

	return null;
}

registerPlugin( 'wpcom-block-editor-nux', {
	render: () => (
		<HasSeenSellerCelebrationModalProvider>
			<HasSeenVideoCelebrationModalProvider>
				<ShouldShowFirstPostPublishedModalProvider>
					<WelcomeTour />
					<FirstPostPublishedModal />
					<RecommendedTagsModal />
					<SellerCelebrationModal />
					<PurchaseNotice />
					<VideoPressCelebrationModal />
					<BloggingPromptsModal />
				</ShouldShowFirstPostPublishedModalProvider>
			</HasSeenVideoCelebrationModalProvider>
		</HasSeenSellerCelebrationModalProvider>
	),
} );
