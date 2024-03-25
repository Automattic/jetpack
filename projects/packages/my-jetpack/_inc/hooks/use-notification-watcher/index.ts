import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useBadInstallNotice from './use-bad-install-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

const useNotificationWatcher = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();

	useBadInstallNotice( redBubbleAlerts );
	useSiteConnectionNotice( redBubbleAlerts );
};

export default useNotificationWatcher;
