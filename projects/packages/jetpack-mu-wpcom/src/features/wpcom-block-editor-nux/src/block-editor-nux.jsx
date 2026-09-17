import { registerPlugin } from '@wordpress/plugins';
import {
	HasSeenSellerCelebrationModalProvider,
	HasSeenVideoCelebrationModalProvider,
	ShouldShowFirstPostPublishedModalProvider,
	useIsFourForFourEligible,
} from '../../../common/tour-kit';
import FirstPostPublishedModal from './first-post-published-modal';
import FourForFourModal from './four-for-four-modal';
import PurchaseNotice from './purchase-notice';
import RecommendedTagsModal from './recommended-tags-modal';
import SellerCelebrationModal from './seller-celebration-modal';
import VideoPressCelebrationModal from './video-celebration-modal';

// One post-publish modal per publish: the 4 for 4 offer takes precedence over
// the first-post celebration when the site qualifies for it.
const PostPublishedModal = () =>
	useIsFourForFourEligible() ? <FourForFourModal /> : <FirstPostPublishedModal />;

registerPlugin( 'wpcom-block-editor-nux', {
	render: () => (
		<HasSeenSellerCelebrationModalProvider>
			<HasSeenVideoCelebrationModalProvider>
				<ShouldShowFirstPostPublishedModalProvider>
					<PostPublishedModal />
					<RecommendedTagsModal />
					<SellerCelebrationModal />
					<PurchaseNotice />
					<VideoPressCelebrationModal />
				</ShouldShowFirstPostPublishedModalProvider>
			</HasSeenVideoCelebrationModalProvider>
		</HasSeenSellerCelebrationModalProvider>
	),
} );
