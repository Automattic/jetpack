import { getSiteData } from '@automattic/jetpack-script-data';
import { Notice } from '@wordpress/components';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import EpisodeStats from './components/episode-stats';
import PeriodControl, { getPeriodHeading } from './components/period-control';
import StatsByApp from './components/stats-by-app';
import StatsByDayChart from './components/stats-by-day-chart';
import StatsLocations from './components/stats-locations';
import StatsTopEpisodes from './components/stats-top-episodes';
import SummaryTiles from './components/summary-tiles';
import './style.scss';
import { useShowStatsQuery } from './use-show-stats-query';
import type { PodcastStatsPeriod, PodcastStatsTopEpisode } from './types';

const Stats = () => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	const [ period, setPeriod ] = useState< PodcastStatsPeriod >( '30d' );
	const [ selected, setSelected ] = useState< PodcastStatsTopEpisode | null >( null );
	const headingRef = useRef< HTMLHeadingElement | null >( null );
	const prevSelectedRef = useRef< PodcastStatsTopEpisode | null >( null );

	const { data: stats, isLoading, isError } = useShowStatsQuery( period );

	const handleBack = useCallback( () => setSelected( null ), [] );

	// Return focus to the heading after leaving the drilldown; the back button has unmounted.
	useEffect( () => {
		if ( prevSelectedRef.current !== null && selected === null ) {
			headingRef.current?.focus();
		}
		prevSelectedRef.current = selected;
	}, [ selected ] );

	if ( ! blogId ) {
		return (
			<div className="podcast-stats podcast-stats--stack">
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'Podcast stats are unavailable until this site is connected to WordPress.com.',
						'jetpack-podcast'
					) }
				</Notice>
			</div>
		);
	}

	if ( selected ) {
		return (
			<EpisodeStats
				postId={ selected.post_id }
				title={ selected.title || __( '(Untitled)', 'jetpack-podcast' ) }
				onBack={ handleBack }
				initialPeriod={ period }
			/>
		);
	}

	// Gate the full empty state on all-time plays so a quiet period doesn't masquerade as a new show.
	const isEmpty = ! isLoading && ! isError && stats?.all_time_plays === 0;

	return (
		<div className="podcast-stats podcast-stats--stack">
			<div className="podcast-stats__header">
				<header className="podcast-stats__section-header">
					<h2 ref={ headingRef } tabIndex={ -1 } className="podcast-stats__period-heading">
						{ getPeriodHeading( period ) }
					</h2>
					<p className="podcast-stats__section-description">
						{ __(
							'Track downloads, top episodes, apps, and listener locations.',
							'jetpack-podcast'
						) }
					</p>
				</header>
				<PeriodControl value={ period } onChange={ setPeriod } />
			</div>

			{ isError && (
				<Notice status="error" isDismissible={ false }>
					{ __(
						'There was a problem loading podcast stats. Please try again.',
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
							'Share your show on your favorite podcast apps to start collecting data here.',
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
						period={ period }
						isLoading={ isLoading }
					>
						<SummaryTiles
							totalPlays={ stats?.total_plays }
							byApp={ stats?.by_app }
							byCountry={ stats?.by_country }
							topDay={ stats?.top_day }
							isLoading={ isLoading }
							layout="chart"
						/>
					</StatsByDayChart>
					<div className="podcast-stats__module-grid">
						<StatsTopEpisodes
							episodes={ stats?.top_episodes }
							isLoading={ isLoading }
							onSelect={ setSelected }
						/>
						<StatsByApp rows={ stats?.by_app } isLoading={ isLoading } />
					</div>
					<StatsLocations rows={ stats?.by_country } isLoading={ isLoading } />
				</>
			) }
		</div>
	);
};

export default Stats;
