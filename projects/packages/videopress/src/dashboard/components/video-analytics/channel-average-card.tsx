import { __ } from '@wordpress/i18n';
import { Card } from '@wordpress/ui';
import { formatWatchTime } from '../../utils/format';
// Skeleton placeholder classes live in the shared stats stylesheet.
import '../stats/style.scss';
import './style.scss';
import type { ChannelAverages, VideoStats } from '../../types/stats';
import type { ReactElement, ReactNode } from 'react';

type Props = {
	stats: VideoStats;
	channel: ChannelAverages;
	isLoading: boolean;
};

// Channel averages are per-video means, so they are fractional; both
// columns round to integers to read like the KPI cards above.
const NUMBER_FORMATTER = new Intl.NumberFormat( undefined, { maximumFractionDigits: 0 } );
const PERCENT_FORMATTER = new Intl.NumberFormat( undefined, { maximumFractionDigits: 1 } );

const formatCount = ( value: number ): string => NUMBER_FORMATTER.format( value );
const formatPercent = ( value: number ): string => `${ PERCENT_FORMATTER.format( value ) }%`;

type Row = {
	key: string;
	label: string;
	video: string;
	channel: string;
};

/**
 * "Compared to channel average" card for the per-video Analytics
 * screen. Puts this video's KPIs for the selected period next to the
 * per-video average across every video with plays in the same window.
 * Both columns derive from the one video-plays response the screen has
 * already fetched (`useVideoStats` / `useChannelAverages` share the
 * query), so the card adds no request.
 *
 * @param props           - Component props.
 * @param props.stats     - This video's stats for the current window.
 * @param props.channel   - Channel-wide per-video averages for the same window.
 * @param props.isLoading - When true, value cells render as skeletons.
 * @return The card element.
 */
export default function ChannelAverageCard( { stats, channel, isLoading }: Props ): ReactElement {
	const rows: Row[] = [
		{
			key: 'views',
			label: __( 'Views', 'jetpack-videopress-pkg' ),
			video: formatCount( stats.views.current ),
			channel: formatCount( channel.views ),
		},
		{
			key: 'impressions',
			label: __( 'Impressions', 'jetpack-videopress-pkg' ),
			video: formatCount( stats.impressions.current ),
			channel: formatCount( channel.impressions ),
		},
		{
			key: 'watch-time',
			label: __( 'Watch time', 'jetpack-videopress-pkg' ),
			video: formatWatchTime( stats.watchTimeSeconds.current ),
			channel: formatWatchTime( channel.watchTimeSeconds ),
		},
		{
			key: 'retention',
			label: __( 'Retention', 'jetpack-videopress-pkg' ),
			video: formatPercent( stats.retentionRate.current ),
			channel: formatPercent( channel.retentionRate ),
		},
	];

	const cell = ( value: string ): ReactNode =>
		isLoading ? (
			<span
				className="vp-overview__skeleton-block vp-overview__skeleton-block--narrow"
				aria-hidden="true"
			/>
		) : (
			value
		);

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title>{ __( 'Compared to channel average', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<div
					className="vp-video-analytics__compare"
					role="table"
					aria-label={ __( 'Compared to channel average', 'jetpack-videopress-pkg' ) }
				>
					<div className="vp-video-analytics__compare-head" role="row">
						<span role="columnheader">{ __( 'METRIC', 'jetpack-videopress-pkg' ) }</span>
						<span role="columnheader" className="vp-video-analytics__compare-value">
							{ __( 'THIS VIDEO', 'jetpack-videopress-pkg' ) }
						</span>
						<span role="columnheader" className="vp-video-analytics__compare-value">
							{ __( 'CHANNEL AVG', 'jetpack-videopress-pkg' ) }
						</span>
					</div>
					{ rows.map( row => (
						<div key={ row.key } className="vp-video-analytics__compare-row" role="row">
							<span role="cell">{ row.label }</span>
							<span role="cell" className="vp-video-analytics__compare-value">
								{ cell( row.video ) }
							</span>
							<span role="cell" className="vp-video-analytics__compare-value">
								{ cell( row.channel ) }
							</span>
						</div>
					) ) }
				</div>
			</Card.Content>
		</Card.Root>
	);
}
