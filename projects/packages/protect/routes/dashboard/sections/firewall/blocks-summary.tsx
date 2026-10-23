import { LineChart, parseAsLocalDate } from '@automattic/charts';
import '@automattic/charts/style.css';
import { gmdateI18n } from '@wordpress/date';
import { useCallback, useMemo } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import formatNumber from '../../components/format-number';
import type { FirewallBlocks } from './types';
import type { SeriesData } from '@automattic/charts';

const LINE_COLOR = '#3858e9';

const formatCount = ( count?: number | null ) =>
	typeof count === 'number' ? formatNumber( count ) : '—';

// Days are UTC dates, so format them in UTC to keep the same day.
const formatDay = ( date: string, format = 'M j' ) => gmdateI18n( format, `${ date }T00:00:00Z` );

type TooltipProps = {
	tooltipData?: { nearestDatum?: { datum?: { dateString?: string; value?: number } } };
};

/**
 * Blocked requests over the last 30 days, with today and all time beside a line of the daily counts.
 *
 * @param props        - Component props.
 * @param props.blocks - The block counts.
 * @return The summary.
 */
export default function BlocksSummary( { blocks }: { blocks: FirewallBlocks } ) {
	const { dailyBlocks } = blocks;
	const days = useMemo( () => dailyBlocks ?? [], [ dailyBlocks ] );
	const today = days[ days.length - 1 ]?.date;

	// Each day is plotted at local midnight, so the axis keeps the calendar day the server sent.
	const points = useMemo(
		() =>
			days.map( day => ( {
				date: parseAsLocalDate( day.date ),
				dateString: day.date,
				value: day.count,
			} ) ),
		[ days ]
	);
	const data = useMemo< SeriesData[] >(
		() => [
			{
				label: __( 'Blocked requests', 'jetpack-protect-pkg' ),
				data: points,
				options: { stroke: LINE_COLOR },
			},
		],
		[ points ]
	);

	const tickFormat = useCallback(
		( value: unknown ) => {
			const date = value instanceof Date ? value : new Date( Number( value ) );
			const day = points.find( point => point.date.getTime() === date.getTime() )?.dateString;
			if ( ! day ) {
				return '';
			}
			return day === today ? __( 'Today', 'jetpack-protect-pkg' ) : formatDay( day );
		},
		[ points, today ]
	);

	const renderTooltip = useCallback( ( props: unknown ) => {
		const datum = ( props as TooltipProps )?.tooltipData?.nearestDatum?.datum;
		if ( ! datum?.dateString ) {
			return null;
		}
		const count = datum.value ?? 0;
		return (
			<>
				<strong>{ formatDay( datum.dateString, 'M j, Y' ) }</strong>
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
					<LineChart
						data={ data }
						height={ 140 }
						ariaLabel={ __( 'Blocked requests per day, last 30 days', 'jetpack-protect-pkg' ) }
						curveType="monotone"
						withGradientFill
						withTooltips
						renderTooltip={ renderTooltip }
						gridVisibility="none"
						margin={ { top: 8, right: 16, bottom: 24, left: 16 } }
						options={ {
							axis: {
								x: {
									tickValues: [ points[ 0 ].date, points[ points.length - 1 ].date ],
									tickFormat,
								},
								y: { display: false },
							},
							yScale: { type: 'linear', zero: true },
						} }
					/>
				</div>
			) }
		</div>
	);
}
