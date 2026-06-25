import { AddAccountModal } from '../add-account-modal';
import { ThemedConnectionsModal as ManageConnectionsModal } from '../manage-connections-modal';
import { UnifiedModal } from '../unified-modal';

export const GlobalModals = () => {
	return (
		<>
			<UnifiedModal />
			<AddAccountModal />
			<ManageConnectionsModal />
		</>
	);
};
