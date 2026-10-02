export { queryClient, AnalyticsQueryClientProvider } from './query-client-provider';

export { GlobalErrorProvider, useGlobalError } from './global-error-context';

export { globalErrorManager, type GlobalErrorType } from './global-error-manager';

export { ReportScopeProvider, useReportScope, type ReportScope } from './report-scope';

export {
	PERIOD_CHANGE_ATTENTION_MS,
	PeriodChangeSignalProvider,
	postSurface,
	useRaisePeriodChange,
	useSettlePeriodChange,
} from './period-change-signal';
