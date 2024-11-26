import { registerPlugin } from '@wordpress/plugins';
import {
	HasSeenSellerCelebrationModalProvider,
	HasSeenVideoCelebrationModalProvider,
	ShouldShowFirstPostPublishedModalProvider,
} from '../../../common/tour-kit';
import { BloggingPromptsModal } from './blogging-prompts-modal';
import FirstPostPublishedModal from './first-post-published-modal';
import PurchaseNotice from './purchase-notice';
import RecommendedTagsModal from './recommended-tags-modal';
import SellerCelebrationModal from './seller-celebration-modal';
import VideoPressCelebrationModal from './video-celebration-modal';

registerPlugin( 'wpcom-block-editor-nux', {
	render: () => (
		<HasSeenSellerCelebrationModalProvider>
			<HasSeenVideoCelebrationModalProvider>
				<ShouldShowFirstPostPublishedModalProvider>
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
