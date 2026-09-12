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
	useCalendarHeatmapData,
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
 * WordPress design system
 *
 * `Field` is exported as `FormField`: `@wordpress/ui`'s form-field namespace
 * collides with DataViews' `Field` type under one barrel, and DataViews' name
 * is what consumers already import. Still a plain re-export, not a wrap.
 */
export {
	Badge,
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
	RangeCalendar,
	SelectControl,
	Skeleton,
	Stack,
	Tabs,
	Text,
	TextareaControl,
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
