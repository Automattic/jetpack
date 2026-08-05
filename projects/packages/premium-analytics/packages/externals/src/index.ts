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
	HeatmapChart,
	HeatmapChartUnresponsive,
	LeaderboardChartUnresponsive,
	Legend,
	LineChart,
	PieChartUnresponsive,
	PieSemiCircleChart,
	buildCalendarHeatmapData,
	lightenHexColor,
	normalizeColorToHex,
	useGlobalChartsContext,
	type BaseLegendItem,
	type ChartTheme,
	type DataPointDate,
	type DataPointPercentage,
	type GeoChartError,
	type GeoData,
	type GoogleDataTableColumn,
	type GoogleDataTableRow,
	type LineStyles,
	type SeriesData,
} from '@automattic/charts';

export { LineShape, RectShape } from '@automattic/charts/visx/legend';

/**
 * Calendar
 *
 * `DateRangeCalendar` is the package's only `@automattic/ui` consumer, but it
 * reaches `react-day-picker` and `date-fns` behind it — ~55 KB of minified
 * vendor code that would otherwise be re-emitted on every edit to the module
 * that imports it.
 */
export { DateRangeCalendar } from '@automattic/ui';

/**
 * WordPress design system
 *
 * `Field` is exported as `FormField`: `@wordpress/ui`'s form-field namespace and
 * `@wordpress/dataviews`' `Field` type collide under one barrel, and DataViews'
 * `Field` is the name consumers already import from here. The alias is still a
 * plain re-export — it renames, it does not wrap.
 */
export {
	Button,
	EmptyState,
	Field as FormField,
	Fieldset,
	Icon,
	Input,
	Link,
	SelectControl,
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
