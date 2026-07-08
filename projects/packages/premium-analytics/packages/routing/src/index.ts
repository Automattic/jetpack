export {
	encodeDateToSearchParam,
	writeDateRangeToSearch,
	writeComparisonToSearch,
} from './search/date-range';

export { deriveComparisonRange } from './search/comparison';
export {
	REPORT_DATE_PARAM_KEYS,
	pickReportDateParams,
	buildDashboardLink,
} from './search/report-params';
export {
	useStagedSearch,
	useReportDateFilters,
	useDashboardLink,
	type ReportDateFilters,
} from './hooks';
