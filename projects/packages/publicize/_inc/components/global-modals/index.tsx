import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { ThemedShareStatusModal as ShareStatusModal } from '../share-status';
import { UnifiedModal } from '../unified-modal';

export const GlobalModals = () => {
	return (
		<>
			<ShareStatusModal />
			<UnifiedModal />
			<ManageConnectionsModal />
		</>
	);
};
