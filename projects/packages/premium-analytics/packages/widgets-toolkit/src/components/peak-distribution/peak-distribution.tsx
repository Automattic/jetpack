/**
 * External dependencies
 */
import { Sparkline, Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { _n, sprintf } from '@wordpress/i18n';
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
	const exactViews = formatMetricValue( value, 'number', plainViewsOptions );
	const formattedViews = formatMetricValue(
		value,
		'number',
		value >= 1000 ? ABBREVIATED_VIEWS_OPTIONS : plainViewsOptions
	);
	// Choose the plural form from the displayed precision, so a value rendered
	// as "1" is not followed by the plural "views".
	const displayedValue = Number( value.toFixed( valueDecimals ) );

	const viewsTemplate =
		valueUnit === 'views-per-day'
			? /* translators: %s is the average number of views per day, e.g. "1.4". */
			  _n( '%s view per day', '%s views per day', displayedValue, 'jetpack-premium-analytics-pkg' )
			: /* translators: %s is a number of views, e.g. "166.9K". */
			  _n( '%s view', '%s views', displayedValue, 'jetpack-premium-analytics-pkg' );
	const viewsLabel = sprintf( viewsTemplate, formattedViews );
	const exactViewsLabel = sprintf( viewsTemplate, exactViews );

	return (
		<div className={ styles.body }>
			<div className={ styles.headline }>
				{ /* Not `MetricValue`: it pins a 20px line-height at any font size, which
				    clips 32px glyphs. `heading-2xl` pairs 32px with 40px. */ }
				<Text variant="heading-2xl">{ label }</Text>
				<Text variant="body-md" className={ styles.views } title={ exactViews }>
					{ viewsLabel === exactViewsLabel ? (
						viewsLabel
					) : (
						<>
							{ /* `title` is not reliably announced, so the abbreviation is hidden
							    from assistive tech and the exact figure read in its place. */ }
							<span aria-hidden="true">{ viewsLabel }</span>
							<VisuallyHidden>{ exactViewsLabel }</VisuallyHidden>
						</>
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
