import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useBackupNeedsAttentionNotice from './use-backup-needs-attention-notice';
import useBadInstallNotice from './use-bad-install-notice';
import useConnectionErrorsNotice from './use-connection-errors-notice';
import useDeprecateFeatureNotice from './use-deprecate-feature-notice';
import useExpiringPlansNotice from './use-expiring-plans-notice';
import usePaidPlanNeedsPluginInstallActivationNotice from './use-paid-plan-needs-plugin-install-activation-notice';
import useProtectThreatsDetectedNotice from './use-protect-threats-detected-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

const useNotificationWatcher = () => {
	const { redBubbleAlerts } = getMyJetpackWindowInitialState();

	usePaidPlanNeedsPluginInstallActivationNotice( redBubbleAlerts );
	useProtectThreatsDetectedNotice( redBubbleAlerts );
	useExpiringPlansNotice( redBubbleAlerts );
	useBackupNeedsAttentionNotice( redBubbleAlerts );
	useDeprecateFeatureNotice( redBubbleAlerts );
	useConnectionErrorsNotice();
	useSiteConnectionNotice( redBubbleAlerts );
	useBadInstallNotice( redBubbleAlerts );
};

export default useNotificationWatcher;
