import { LineChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { Icon } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { Button, Text } from '@wordpress/ui';
import { getSubscriberSeries, type ChartGranularity } from './placeholder-data';

const CHART_HEIGHT = 300;

type Props = {
	granularity: ChartGranularity;
	onChangeGranularity: ( next: ChartGranularity ) => void;
};

/**
 * The cadence options, in display order.
 *
 * A function rather than a module constant so each `__()` runs at render time.
 *
 * @return The granularity options.
 */
const getGranularities = (): Array< { value: ChartGranularity; label: string } > => [
	{ value: 'days', label: __( 'Days', 'jetpack-newsletter' ) },
	{ value: 'weeks', label: __( 'Weeks', 'jetpack-newsletter' ) },
	{ value: 'months', label: __( 'Months', 'jetpack-newsletter' ) },
	{ value: 'years', label: __( 'Years', 'jetpack-newsletter' ) },
];

/**
 * Subscribers over time.
 *
 * The cadence control is live — it redraws the sample series — so the shape of
 * the interaction can be judged. The prev/next arrows are deliberately inert:
 * there is no history to page through until the series is real, and an arrow
 * that silently does nothing is worse than one that says it cannot.
 *
 * @param props                     - Component props.
 * @param props.granularity         - Cadence currently drawn.
 * @param props.onChangeGranularity - Called when a cadence is picked.
 * @return The subscribers card.
 */
export const SubscribersChart = ( { granularity, onChangeGranularity }: Props ): JSX.Element => {
	// Memoized deliberately. `LineChart` feeds these back into its own hooks, so
	// a fresh array identity on every render visibly breaks the y-axis — the same
	// trap called out in VideoPress's views-trends-card.
	const data = useMemo(
		() => [
			{
				label: __( 'Subscribers', 'jetpack-newsletter' ),
				data: getSubscriberSeries( granularity ),
				options: {},
			},
		],
		[ granularity ]
	);

	const options = useMemo(
		() => ( {
			axis: {
				x: { orientation: 'bottom' as const },
				y: { orientation: 'right' as const },
			},
		} ),
		[]
	);

	const handleGranularity = useCallback(
		( next: ChartGranularity ) => () => onChangeGranularity( next ),
		[ onChangeGranularity ]
	);

	return (
		<div className="jetpack-newsletter-home__panel">
			<div className="jetpack-newsletter-home__panel-header">
				<Text variant="heading-lg" render={ <h2 /> }>
					{ __( 'Subscribers', 'jetpack-newsletter' ) }
				</Text>
				<div className="jetpack-newsletter-home__chart-controls">
					{ /* TODO: page through the series once it is real. Disabled rather
					     than hidden so the control is in the design being reviewed. */ }
					<Button
						variant="unstyled"
						disabled
						className="jetpack-newsletter-home__chart-step"
						aria-label={ __( 'Previous period', 'jetpack-newsletter' ) }
					>
						<Icon icon={ arrowLeft } size={ 24 } />
					</Button>
					<Button
						variant="unstyled"
						disabled
						className="jetpack-newsletter-home__chart-step"
						aria-label={ __( 'Next period', 'jetpack-newsletter' ) }
					>
						<Icon icon={ arrowRight } size={ 24 } />
					</Button>
					<div
						className="jetpack-newsletter-home__granularity"
						role="group"
						aria-label={ __( 'Chart cadence', 'jetpack-newsletter' ) }
					>
						{ getGranularities().map( option => (
							<Button
								key={ option.value }
								variant="unstyled"
								onClick={ handleGranularity( option.value ) }
								aria-pressed={ option.value === granularity }
								className={
									option.value === granularity
										? 'jetpack-newsletter-home__granularity-option is-selected'
										: 'jetpack-newsletter-home__granularity-option'
								}
							>
								{ option.label }
							</Button>
						) ) }
					</div>
				</div>
			</div>
			<div className="jetpack-newsletter-home__chart">
				<LineChart
					data={ data }
					options={ options }
					height={ CHART_HEIGHT }
					withGradientFill
					curveType="linear"
					showLegend={ false }
				/>
			</div>
		</div>
	);
};
