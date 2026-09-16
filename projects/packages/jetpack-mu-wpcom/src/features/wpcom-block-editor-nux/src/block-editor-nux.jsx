import { registerPlugin } from '@wordpress/plugins';
import {
	FourForFourProvider,
	HasSeenSellerCelebrationModalProvider,
	HasSeenVideoCelebrationModalProvider,
	ShouldShowFirstPostPublishedModalProvider,
} from '../../../common/tour-kit';
import FirstPostPublishedModal from './first-post-published-modal';
import FourForFourModal from './four-for-four-modal';
import PurchaseNotice from './purchase-notice';
import RecommendedTagsModal from './recommended-tags-modal';
import SellerCelebrationModal from './seller-celebration-modal';
import VideoPressCelebrationModal from './video-celebration-modal';

registerPlugin( 'wpcom-block-editor-nux', {
	render: () => (
		<HasSeenSellerCelebrationModalProvider>
			<HasSeenVideoCelebrationModalProvider>
				<ShouldShowFirstPostPublishedModalProvider>
					<FourForFourProvider>
						<FourForFourModal />
						<FirstPostPublishedModal />
						<RecommendedTagsModal />
						<SellerCelebrationModal />
						<PurchaseNotice />
						<VideoPressCelebrationModal />
					</FourForFourProvider>
				</ShouldShowFirstPostPublishedModalProvider>
			</HasSeenVideoCelebrationModalProvider>
		</HasSeenSellerCelebrationModalProvider>
	),
} );
