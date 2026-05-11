import { Button, Notice } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useEpisodeDetailStatsQuery } from '../use-episode-detail-stats-query';
import { useEpisodeTitleQuery } from '../use-episode-title-query';
import PeriodControl, { getPeriodHeading } from './period-control';
import StatsByApp from './stats-by-app';
import StatsByCountry from './stats-by-country';
import StatsByDayChart from './stats-by-day-chart';
import SummaryTiles from './summary-tiles';
import type { PodcastStatsPeriod } from '../types';

type EpisodeStatsProps = {
	postId: number;
	onBack: () => void;
	initialPeriod?: PodcastStatsPeriod;
};

const EpisodeStats = ( { postId, onBack, initialPeriod = '30d' }: EpisodeStatsProps ) => {
	const [ period, setPeriod ] = useState< PodcastStatsPeriod >( initialPeriod );
	const headingRef = useRef< HTMLHeadingElement | null >( null );

	const { data: stats, isLoading, isError } = useEpisodeDetailStatsQuery( postId, period );
	const { data: episodeTitle } = useEpisodeTitleQuery( postId );

	const heading =
		episodeTitle ||
		sprintf(
			/* translators: %d is the episode post id. */
			__( 'Episode ID %d', 'jetpack-podcast' ),
			postId
		);
	const isEmpty = ! isLoading && ! isError && stats?.total_plays === 0;

	useEffect( () => {
		headingRef.current?.focus();
	}, [ postId ] );

	return (
		<div className="podcast-stats podcast-stats--stack">
			<div className="podcast-stats__header">
				<header className="podcast-stats__section-header">
					<Button variant="tertiary" onClick={ onBack } className="podcast-stats__back-link">
						{ __( 'Back to stats', 'jetpack-podcast' ) }
					</Button>
					<h2
						ref={ headingRef }
						tabIndex={ -1 }
						className="podcast-stats__period-heading podcast-stats__episode-heading"
					>
						{ heading }
					</h2>
					<p className="podcast-stats__section-description">
						{ getPeriodHeading( period, 'episode' ) }
					</p>
				</header>
				<div className="podcast-stats__period-control">
					<PeriodControl value={ period } onChange={ setPeriod } scope="episode" />
				</div>
			</div>

			{ isError && (
				<Notice status="error" isDismissible={ false }>
					{ __(
						'There was a problem loading episode stats. Please try again.',
						'jetpack-podcast'
					) }
				</Notice>
			) }

			{ ! isError && isEmpty && (
				<Notice status="info" isDismissible={ false }>
					{ __(
						'No downloads yet. Share this episode to start collecting downloads.',
						'jetpack-podcast'
					) }
				</Notice>
			) }

			{ ! isError && ! isEmpty && (
				<>
					<StatsByDayChart
						byDay={ stats?.by_day }
						range={ stats?.range }
						period={ period }
						isLoading={ isLoading }
					>
						<SummaryTiles
							totalPlays={ stats?.total_plays }
							byApp={ stats?.by_app }
							byCountry={ stats?.by_country }
							topDay={ stats?.top_day }
							isLoading={ isLoading }
							variant="episode"
							layout="chart"
						/>
					</StatsByDayChart>
					<div className="podcast-stats__module-grid">
						<StatsByApp rows={ stats?.by_app } isLoading={ isLoading } />
						<StatsByCountry rows={ stats?.by_country } isLoading={ isLoading } />
					</div>
				</>
			) }
		</div>
	);
};

export default EpisodeStats;
