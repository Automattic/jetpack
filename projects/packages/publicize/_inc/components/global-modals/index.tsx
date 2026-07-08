import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { UnifiedModal } from '../unified-modal';

export const GlobalModals = () => {
	return (
		<>
			<UnifiedModal />
			<ManageConnectionsModal />
		</>
	);
};
