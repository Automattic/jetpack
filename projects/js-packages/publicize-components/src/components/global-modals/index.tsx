import { useSelect } from '@wordpress/data';
import { store as socialStore } from '../../social-store';
import { ThemedShareStatusModal as ShareStatusModal } from '../share-status';

export const GlobalModals = () => {
	const featureFlags = useSelect( select => select( socialStore ).featureFlags(), [] );

	return <>{ featureFlags.useShareStatus ? <ShareStatusModal /> : null }</>;
};
