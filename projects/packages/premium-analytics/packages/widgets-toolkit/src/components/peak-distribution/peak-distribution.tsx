/**
 * External dependencies
 */
import { Sparkline, Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __, _n, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './peak-distribution.module.scss';

export type PeakDistributionProps = {
	label: string;
	value: number;
	points: number[];
	valueDecimals?: number;
	valueUnit?: 'views' | 'views-per-day';
};

// `decimals: 0` would round 166,900 to "167K"; the prototype's secondary figure
// keeps the digit ("166.9K").
const ABBREVIATED_VIEWS_OPTIONS = { useMultipliers: true, decimals: 1 };
const PLAIN_VIEWS_OPTIONS = { decimals: 0 };

/**
 * Display a peak label and view count above its distribution.
 */
export function PeakDistribution( {
	label,
	value,
	points,
	valueDecimals = 0,
	valueUnit = 'views',
}: PeakDistributionProps ) {
	const plainViewsOptions = { ...PLAIN_VIEWS_OPTIONS, decimals: valueDecimals };
	// A positive figure can round to zero at the shown precision (one view a month is
	// 0.03 a day), and a named peak over "0 views per day" reads as no data.
	const isBelowPrecision = value > 0 && Number( value.toFixed( valueDecimals ) ) === 0;
	const shownValue = isBelowPrecision ? 10 ** -valueDecimals : value;
	const exactViews = formatMetricValue( shownValue, 'number', plainViewsOptions );
	const formattedViews = formatMetricValue(
		shownValue,
		'number',
		shownValue >= 1000 ? ABBREVIATED_VIEWS_OPTIONS : plainViewsOptions
	);
	// Choose the plural form from the displayed precision, so a value rendered
	// as "1" is not followed by the plural "views".
	const displayedValue = Number( shownValue.toFixed( valueDecimals ) );

	const viewsTemplate =
		valueUnit === 'views-per-day'
			? /* translators: %s is the average number of views per day, e.g. "1.4". */
			  _n( '%s view per day', '%s views per day', displayedValue, 'jetpack-premium-analytics-pkg' )
			: /* translators: %s is a number of views, e.g. "166.9K". */
			  _n( '%s view', '%s views', displayedValue, 'jetpack-premium-analytics-pkg' );
	/* translators: %s is a views figure with its unit, e.g. "0.1 views per day". */
	const belowTemplate = __( 'Fewer than %s', 'jetpack-premium-analytics-pkg' );
	const describeViews = ( figure: string ) => {
		const measured = sprintf( viewsTemplate, figure );

		return isBelowPrecision ? sprintf( belowTemplate, measured ) : measured;
	};
	const viewsLabel = describeViews( formattedViews );
	const exactViewsLabel = describeViews( exactViews );
	const isAbbreviated = viewsLabel !== exactViewsLabel;

	return (
		<div className={ styles.body }>
			<div className={ styles.headline }>
				{ /* Not `MetricValue`: it pins a 20px line-height at any font size, which
				    clips 32px glyphs. `heading-2xl` pairs 32px with 40px. */ }
				<Text variant="heading-2xl">{ label }</Text>
				<Text
					variant="body-md"
					className={ styles.views }
					// Only an abbreviation hides a figure the tooltip can restore.
					title={ isAbbreviated ? exactViews : undefined }
				>
					{ isAbbreviated ? (
						<>
							{ /* `title` is not reliably announced, so the abbreviation is hidden
							    from assistive tech and the exact figure read in its place. */ }
							<span aria-hidden="true">{ viewsLabel }</span>
							<VisuallyHidden>{ exactViewsLabel }</VisuallyHidden>
						</>
					) : (
						viewsLabel
					) }
				</Text>
			</div>
			<div className={ styles.chart }>
				{ /* `withResponsive` caps width at 1200px by default, stranding space on a
				    wider card. */ }
				<Sparkline data={ points } maxWidth={ Infinity } />
			</div>
		</div>
	);
}
