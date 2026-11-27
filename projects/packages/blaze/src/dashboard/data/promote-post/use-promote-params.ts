import { useRouteModal } from '../../compat/route-modal';
import { useSelector, getCurrentQueryArguments, getSelectedSite } from '../../compat/state';
import { getWidgetParams } from '../../promote-post-i2/utils';

const blazePressWidgetKey = 'blazepress-widget';

type UsePromoteParams = {
	selectedSiteId: number;
	selectedPostId: string;
	selectedCampaignId: string;
	isModalOpen: boolean;
	keyValue: string;
};

const usePromoteParams = (): UsePromoteParams => {
	const selectedSite = useSelector( getSelectedSite );
	const selectedSiteId = selectedSite?.ID || 0;
	const currentQuery = useSelector( getCurrentQueryArguments );
	const keyValue = ( currentQuery && ( currentQuery[ blazePressWidgetKey ] as string ) ) || '';
	const widgetParams = getWidgetParams( keyValue );
	const selectedPostId = widgetParams.selectedPostId;
	const selectedCampaignId = widgetParams.selectedCampaignId;
	const { isModalOpen } = useRouteModal( blazePressWidgetKey, keyValue );

	return {
		selectedSiteId,
		selectedPostId,
		selectedCampaignId,
		isModalOpen,
		keyValue,
	};
};

export default usePromoteParams;
