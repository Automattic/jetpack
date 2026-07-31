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
 * WordPress design system
 */
export {
	Button,
	EmptyState,
	Icon,
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
	type Field,
	type SupportedLayouts,
	type View,
} from '@wordpress/dataviews';
