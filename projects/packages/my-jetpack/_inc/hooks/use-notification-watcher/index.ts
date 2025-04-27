import useRedBubbleQuery from '../../data/use-red-bubble-query';
import useBackupNeedsAttentionNotice from './use-backup-needs-attention-notice';
import useBadInstallNotice from './use-bad-install-notice';
import useConnectionErrorsNotice from './use-connection-errors-notice';
import useExpiringPlansNotice from './use-expiring-plans-notice';
import usePaidPlanNeedsPluginInstallActivationNotice from './use-paid-plan-needs-plugin-install-activation-notice';
import useProtectThreatsDetectedNotice from './use-protect-threats-detected-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

const useNotificationWatcher = () => {
	const { isLoading, data: redBubbleAlerts } = useRedBubbleQuery();

	usePaidPlanNeedsPluginInstallActivationNotice( redBubbleAlerts, isLoading );
	useProtectThreatsDetectedNotice( redBubbleAlerts, isLoading );
	useExpiringPlansNotice( redBubbleAlerts, isLoading );
	useBackupNeedsAttentionNotice( redBubbleAlerts, isLoading );
	useConnectionErrorsNotice();
	useSiteConnectionNotice( redBubbleAlerts, isLoading );
	useBadInstallNotice( redBubbleAlerts, isLoading );
};

export default useNotificationWatcher;
