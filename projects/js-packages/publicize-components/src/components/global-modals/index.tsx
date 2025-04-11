import { siteHasFeature } from '@automattic/jetpack-script-data';
import { features } from '../../utils/constants';
import { ThemedShareStatusModal as ShareStatusModal } from '../share-status';

export const GlobalModals = () => {
	return <>{ siteHasFeature( features.SHARE_STATUS ) ? <ShareStatusModal /> : null }</>;
};
