import { siteHasFeature } from '@automattic/jetpack-script-data';
import { features } from '../../utils/constants';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { ThemedShareStatusModal as ShareStatusModal, SharingActivityModal } from '../share-status';
import { UnifiedModal } from '../unified-modal';

export const GlobalModals = () => {
	return (
		<>
			<ShareStatusModal />
			<SharingActivityModal />
			{ siteHasFeature( features.UNIFIED_UI_V1 ) ? <UnifiedModal /> : null }
			<ManageConnectionsModal />
		</>
	);
};
