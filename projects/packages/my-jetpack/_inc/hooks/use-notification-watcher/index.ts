import useRedBubbleQuery from '../../data/use-red-bubble-query';
import { getMyJetpackWindowInitialState } from '../../data/utils/get-my-jetpack-window-state';
import useBackupNeedsAttentionNotice from './use-backup-needs-attention-notice';
import useBadInstallNotice from './use-bad-install-notice';
import useConnectionErrorsNotice from './use-connection-errors-notice';
import useDeprecateFeatureNotice from './use-deprecate-feature-notice';
import useExpiringPlansNotice from './use-expiring-plans-notice';
import useJetpackStateNotice from './use-jetpack-state-notice';
import usePaidPlanNeedsPluginInstallActivationNotice from './use-paid-plan-needs-plugin-install-activation-notice';
import useProtectThreatsDetectedNotice from './use-protect-threats-detected-notice';
import useSearchVisibilityNotice from './use-search-visibility-notice';
import useSiteConnectionNotice from './use-site-connection-notice';

// Stable, so the deprecation watcher doesn't re-run on every render while it has nothing to show.
const NO_ALERTS = {} as RedBubbleAlerts;

const useNotificationWatcher = () => {
	const { isLoading, data: redBubbleAlerts } = useRedBubbleQuery();

	// First, so on a priority tie it keeps the slot: it reports the user's last action.
	useJetpackStateNotice();
	usePaidPlanNeedsPluginInstallActivationNotice( redBubbleAlerts, isLoading );
	useProtectThreatsDetectedNotice( redBubbleAlerts, isLoading );
	useExpiringPlansNotice( redBubbleAlerts, isLoading );
	useBackupNeedsAttentionNotice( redBubbleAlerts, isLoading );
	useConnectionErrorsNotice();
	useSiteConnectionNotice( redBubbleAlerts, isLoading );
	useBadInstallNotice( redBubbleAlerts, isLoading );
	useDeprecateFeatureNotice(
		getMyJetpackWindowInitialState()?.settingsNotices && ! isLoading && redBubbleAlerts
			? redBubbleAlerts
			: NO_ALERTS
	);
	useSearchVisibilityNotice();
};

export default useNotificationWatcher;
