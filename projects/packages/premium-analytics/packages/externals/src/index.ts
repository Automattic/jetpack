/**
 * Shared third-party passthrough module.
 *
 * Everything here is re-exported verbatim from an external library. Nothing in
 * this package may contain Premium Analytics logic — see README.md for why.
 */

/**
 * External dependencies
 */
import '@automattic/charts/style.css';
import '@automattic/ui/style.css';

/**
 * Charts
 */
export {
	BarChart,
	ConversionFunnelChart,
	GeoChart,
	GlobalChartsProvider,
	GoogleDataTableColumnRoleType,
	HeatmapChart,
	HeatmapChartUnresponsive,
	LeaderboardChartUnresponsive,
	Legend,
	LineChart,
	PieChartUnresponsive,
	PieSemiCircleChart,
	Sparkline,
	buildCalendarHeatmapData,
	getBucketInfo,
	lightenHexColor,
	normalizeColorToHex,
	useGlobalChartsContext,
	type BaseLegendItem,
	type BucketInfo,
	type ChartTheme,
	type DataPointDate,
	type DataPointPercentage,
	type GeoChartError,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
	type HeatmapColumn,
	type HeatmapTooltipData,
	type LineStyles,
	type SeriesData,
	type TickResolution,
} from '@automattic/charts';

export { LineShape, RectShape } from '@automattic/charts/visx/legend';

/**
 * Calendar
 *
 * `DateRangeCalendar` is the package's only `@automattic/ui` consumer, but
 * pulls in `react-day-picker` + `date-fns` behind it — ~55 KB that would
 * otherwise re-emit on every edit to the importing module.
 */
export { DateRangeCalendar } from '@automattic/ui';

/**
 * WordPress design system
 *
 * `Field` is exported as `FormField`: `@wordpress/ui`'s form-field namespace
 * collides with DataViews' `Field` type under one barrel, and DataViews' name
 * is what consumers already import. Still a plain re-export, not a wrap.
 */
export {
	Button,
	Dialog,
	EmptyState,
	LinkButton,
	Field as FormField,
	Fieldset,
	Icon,
	IconButton,
	Input,
	Link,
	Menu,
	Notice,
	Popover,
	SelectControl,
	Skeleton,
	Stack,
	Tabs,
	Text,
	VisuallyHidden,
} from '@wordpress/ui';

/**
 * DataViews
 */
export {
	DataViews,
	filterSortAndPaginate,
	type Action,
	type DataFormControlProps,
	type DataViewRenderFieldProps,
	type Field,
	type Option,
	type SupportedLayouts,
	type View,
	type ViewBaseProps,
} from '@wordpress/dataviews';
