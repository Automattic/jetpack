import { siteHasFeature } from '@automattic/jetpack-script-data';
import { features } from '../../utils/constants';
import { ThemedShareStatusModal as ShareStatusModal } from '../share-status';
import { UnifiedModal } from '../unified-modal';

export const GlobalModals = () => {
	return (
		<>
			<ShareStatusModal />
			{ siteHasFeature( features.UNIFIED_UI_V1 ) ? <UnifiedModal /> : null }
		</>
	);
};
