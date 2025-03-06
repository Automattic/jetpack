import { QUERY_RED_BUBBLE_ALERTS_KEY, REST_API_RED_BUBBLE_ALERTS } from '../../data/constants';
import useSimpleQuery from '../../data/use-simple-query';
import useBackupNeedsAttentionNotice from './use-backup-needs-attention-notice';
import useBadInstallNotice from './use-bad-install-notice';
import useConnectionErrorsNotice from './use-connection-errors-notice';
import useExpiringPlansNotice from './use-expiring-plans-notice';
import usePaidPlanNeedsPluginInstallActivationNotice from './use-paid-plan-needs-plugin-install-activation-notice';
import useProtectThreatsDetectedNotice from './use-protect-threats-detected-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

const useNotificationWatcher = () => {
	const { data: redBubbleAlerts, isLoading } = useSimpleQuery< RedBubbleAlerts >( {
		name: QUERY_RED_BUBBLE_ALERTS_KEY,
		query: { path: REST_API_RED_BUBBLE_ALERTS },
	} );

	usePaidPlanNeedsPluginInstallActivationNotice( redBubbleAlerts, isLoading );
	useProtectThreatsDetectedNotice( redBubbleAlerts, isLoading );
	useExpiringPlansNotice( redBubbleAlerts, isLoading );
	useBackupNeedsAttentionNotice( redBubbleAlerts, isLoading );
	useConnectionErrorsNotice();
	useSiteConnectionNotice( redBubbleAlerts, isLoading );
	useBadInstallNotice( redBubbleAlerts, isLoading );
};

export default useNotificationWatcher;
