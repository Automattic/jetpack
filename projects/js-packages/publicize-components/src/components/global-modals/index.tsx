import { siteHasFeature } from '@automattic/jetpack-script-data';
import { features } from '../../utils/constants';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { ThemedShareStatusModal as ShareStatusModal } from '../share-status';
import { UnifiedModal } from '../unified-modal';

export const GlobalModals = () => {
	return (
		<>
			{ siteHasFeature( features.SHARE_STATUS ) ? <ShareStatusModal /> : null }
			{ siteHasFeature( features.UNIFIED_UI_V1 ) ? <UnifiedModal /> : null }
			<ManageConnectionsModal />
		</>
	);
};
