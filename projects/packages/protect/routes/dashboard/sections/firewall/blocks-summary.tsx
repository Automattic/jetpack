import { BarChart } from '@automattic/charts';
import '@automattic/charts/style.css';
import { gmdateI18n } from '@wordpress/date';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import formatNumber from '../../components/format-number';
import type { FirewallBlocks } from './types';
import type { SeriesData } from '@automattic/charts';

const BAR_COLOR = '#a7b5f2';
const TODAY_COLOR = '#3858e9';

const formatCount = ( count?: number | null ) =>
	typeof count === 'number' ? formatNumber( count ) : '—';

// Days are UTC dates, so format them in UTC to keep the same day.
const formatDay = ( date: string, format = 'M j' ) => gmdateI18n( format, `${ date }T00:00:00Z` );

type TooltipProps = {
	tooltipData?: { nearestDatum?: { datum?: { label?: string; value?: number } } };
};

/**
 * Blocked requests over the last 30 days, with today and all time beside a bar per day.
 *
 * @param props        - Component props.
 * @param props.blocks - The block counts.
 * @return The summary.
 */
export default function BlocksSummary( { blocks }: { blocks: FirewallBlocks } ) {
	const { dailyBlocks } = blocks;
	const days = useMemo( () => dailyBlocks ?? [], [ dailyBlocks ] );
	const today = days[ days.length - 1 ]?.date;

	const data = useMemo< SeriesData[] >(
		() => [
			{
				label: __( 'Blocked requests', 'jetpack-protect-pkg' ),
				data: days.map( day => ( {
					label: day.date,
					value: day.count,
					color: day.date === today ? TODAY_COLOR : BAR_COLOR,
				} ) ),
				options: { stroke: BAR_COLOR },
			},
		],
		[ days, today ]
	);

	const tickFormat = useCallback(
		( value: unknown ) =>
			value === today ? __( 'Today', 'jetpack-protect-pkg' ) : formatDay( String( value ) ),
		[ today ]
	);

	const renderTooltip = useCallback( ( props: unknown ) => {
		const datum = ( props as TooltipProps )?.tooltipData?.nearestDatum?.datum;
		if ( ! datum?.label ) {
			return null;
		}
		const count = datum.value ?? 0;
		return (
			<>
				<strong>{ formatDay( datum.label, 'M j, Y' ) }</strong>
				<div>
					{ sprintf(
						/* translators: %s is a number of blocked requests. */
						_n( '%s blocked', '%s blocked', count, 'jetpack-protect-pkg' ),
						formatNumber( count )
					) }
				</div>
			</>
		);
	}, [] );

	return (
		<div className="jp-protect-firewall-summary">
			<Stack direction="column" gap="md">
				<Stack direction="column" gap="xs">
					<Text variant="body-sm" className="jp-protect-card__muted">
						{ __( 'Blocked in the last 30 days', 'jetpack-protect-pkg' ) }
					</Text>
					<Text variant="heading-2xl" className="jp-protect-card__stat-value">
						{ formatCount( blocks.blockedLast30Days ) }
					</Text>
				</Stack>
				<Stack direction="row" gap="xl">
					<Stack direction="column">
						<Text variant="heading-md">{ formatCount( blocks.blockedToday ) }</Text>
						<Text variant="body-sm" className="jp-protect-card__muted">
							{ __( 'today', 'jetpack-protect-pkg' ) }
						</Text>
					</Stack>
					<Stack direction="column">
						<Text variant="heading-md">{ formatCount( blocks.blockedCount ) }</Text>
						<Text variant="body-sm" className="jp-protect-card__muted">
							{ __( 'all time', 'jetpack-protect-pkg' ) }
						</Text>
					</Stack>
				</Stack>
			</Stack>
			{ days.length > 0 && (
				<div className="jp-protect-firewall-summary__chart">
					<BarChart
						data={ data }
						height={ 140 }
						ariaLabel={ __( 'Blocked requests per day, last 30 days', 'jetpack-protect-pkg' ) }
						withTooltips
						renderTooltip={ renderTooltip }
						showZeroValues
						gridVisibility="none"
						margin={ { top: 8, right: 0, bottom: 24, left: 0 } }
						options={ {
							axis: {
								x: { tickValues: [ days[ 0 ].date, today ], tickFormat },
								y: { display: false },
							},
						} }
					/>
				</div>
			) }
		</div>
	);
}
