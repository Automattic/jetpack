/**
 * External dependencies
 */
import { Sparkline, Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { __, sprintf } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import styles from './peak-distribution.module.scss';

export type PeakDistributionProps = {
	label: string;
	value: number;
	points: number[];
};

// `decimals: 0` would round 166,900 to "167K"; the prototype's secondary figure
// keeps the digit ("166.9K").
const ABBREVIATED_VIEWS_OPTIONS = { useMultipliers: true, decimals: 1 };
const PLAIN_VIEWS_OPTIONS = { decimals: 0 };

/**
 * Display a peak label and view count above its distribution.
 */
export function PeakDistribution( { label, value, points }: PeakDistributionProps ) {
	const exactViews = formatMetricValue( value, 'number', PLAIN_VIEWS_OPTIONS );
	const formattedViews = formatMetricValue(
		value,
		'number',
		value >= 1000 ? ABBREVIATED_VIEWS_OPTIONS : PLAIN_VIEWS_OPTIONS
	);

	/* translators: %s is a number of views, e.g. "166.9K". */
	const viewsTemplate = __( '%s views', 'jetpack-premium-analytics-pkg' );
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
