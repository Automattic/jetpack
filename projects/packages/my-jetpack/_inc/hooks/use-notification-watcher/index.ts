import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useBackupNeedsAttentionNotice from './use-backup-needs-attention-notice';
import useBadInstallNotice from './use-bad-install-notice';
import useConnectionErrorsNotice from './use-connection-errors-notice';
import useDeprecateFeatureNotice from './use-deprecate-feature-notice';
import useExpiringPlansNotice from './use-expiring-plans-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

const useNotificationWatcher = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();

	useBadInstallNotice( redBubbleAlerts );
	useSiteConnectionNotice( redBubbleAlerts );
	useConnectionErrorsNotice();
	useDeprecateFeatureNotice( redBubbleAlerts );
	useBackupNeedsAttentionNotice( redBubbleAlerts );
	useExpiringPlansNotice( redBubbleAlerts );
};

export default useNotificationWatcher;
