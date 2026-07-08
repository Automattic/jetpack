import { Button, Notice } from '@wordpress/components';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useEpisodeDetailStatsQuery } from '../use-episode-detail-stats-query';
import PeriodControl, { getPeriodHeading } from './period-control';
import StatsByApp from './stats-by-app';
import StatsByDayChart from './stats-by-day-chart';
import StatsLocations from './stats-locations';
import SummaryTiles from './summary-tiles';
import type { PodcastStatsSelection } from '../types';

type EpisodeStatsProps = {
	postId: number;
	title: string;
	onBack: () => void;
	initialSelection: PodcastStatsSelection;
};

const EpisodeStats = ( { postId, title, onBack, initialSelection }: EpisodeStatsProps ) => {
	const [ selection, setSelection ] = useState< PodcastStatsSelection >( initialSelection );
	const headingRef = useRef< HTMLHeadingElement | null >( null );

	const { data: stats, isLoading, isError } = useEpisodeDetailStatsQuery( postId, selection );

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
						{ title }
					</h2>
					<p className="podcast-stats__section-description">{ getPeriodHeading( selection ) }</p>
				</header>
				<PeriodControl value={ selection } onChange={ setSelection } />
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
				<div className="podcast__empty-state">
					<h2 className="podcast__section-heading">
						{ __( 'No downloads yet.', 'jetpack-podcast' ) }
					</h2>
					<p>
						{ __(
							'Share this episode on your favorite podcast apps to start collecting downloads here.',
							'jetpack-podcast'
						) }
					</p>
				</div>
			) }

			{ ! isError && ! isEmpty && (
				<>
					<StatsByDayChart
						byDay={ stats?.by_day }
						range={ stats?.range }
						period={ selection.period }
						isLoading={ isLoading }
						summary={
							<SummaryTiles
								totalPlays={ stats?.total_plays }
								byApp={ stats?.by_app }
								byCountry={ stats?.by_country }
								topDay={ stats?.top_day }
								isLoading={ isLoading }
								layout="chart"
							/>
						}
					/>
					<div className="podcast-stats__module-grid">
						<StatsByApp rows={ stats?.by_app } isLoading={ isLoading } />
					</div>
					<StatsLocations rows={ stats?.by_country } isLoading={ isLoading } />
				</>
			) }
		</div>
	);
};

export default EpisodeStats;
