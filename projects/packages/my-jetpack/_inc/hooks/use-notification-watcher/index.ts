import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useBadInstallNotice from './use-bad-install-notice';
import useConnectionErrorsNotice from './use-connection-errors-notice';
import useDeprecateFeatureNotice from './use-deprecate-feature-notice';
import useExpiredPlansNotice from './use-expired-plans-notice';
import useExpiringSoonPlansNotice from './use-expiring-soon-plans-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

const useNotificationWatcher = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();

	useBadInstallNotice( redBubbleAlerts );
	useSiteConnectionNotice( redBubbleAlerts );
	useConnectionErrorsNotice();
	useDeprecateFeatureNotice( redBubbleAlerts );
	useExpiredPlansNotice( redBubbleAlerts );
	useExpiringSoonPlansNotice( redBubbleAlerts );
};

export default useNotificationWatcher;
