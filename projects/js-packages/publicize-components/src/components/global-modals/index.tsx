import { getSocialScriptData } from '../../utils/script-data';
import { ThemedShareStatusModal as ShareStatusModal } from '../share-status';

export const GlobalModals = () => {
	const { feature_flags } = getSocialScriptData();

	return <>{ feature_flags.useShareStatus ? <ShareStatusModal /> : null }</>;
};
