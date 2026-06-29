import { getSiteData } from '@automattic/jetpack-script-data';
import { Notice } from '@wordpress/components';
import { useEntityRecord } from '@wordpress/core-data';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import EpisodeStats from './components/episode-stats';
import PeriodControl, { getPeriodHeading } from './components/period-control';
import StatsByApp from './components/stats-by-app';
import StatsByDayChart from './components/stats-by-day-chart';
import StatsLocations from './components/stats-locations';
import StatsTopEpisodes from './components/stats-top-episodes';
import SummaryTiles from './components/summary-tiles';
import { getDefaultSelection, getStatsDateRange } from './range';
import './style.scss';
import { useShowStatsQuery } from './use-show-stats-query';
import type { PodcastStatsPeriod, PodcastStatsSelection, PodcastStatsTopEpisode } from './types';

const PRESET_PERIODS: PodcastStatsPeriod[] = [ '7d', '30d', '90d', 'all' ];
const isPresetPeriod = ( value: unknown ): value is Exclude< PodcastStatsPeriod, 'custom' > =>
	typeof value === 'string' && ( PRESET_PERIODS as string[] ).includes( value );
const selectionFromPeriod = (
	period: Exclude< PodcastStatsPeriod, 'custom' >
): PodcastStatsSelection => ( { period, range: getStatsDateRange( period ) } );

type StatsSearch = Record< string, unknown > & {
	episode?: string | number;
	period?: string;
};

const Stats = () => {
	const blogId = Number( getSiteData()?.wpcom?.blog_id ?? 0 );
	const [ selection, setSelection ] = useState< PodcastStatsSelection >( () =>
		getDefaultSelection()
	);
	const headingRef = useRef< HTMLHeadingElement | null >( null );

	// `?episode=` owns the drilldown so Episodes-tab plays-clicks deep-link in.
	const search = useSearch( { from: '/' as unknown as never, strict: false } ) as StatsSearch;
	const navigate = useNavigate();

	const rawEpisode = Number( search.episode );
	const selectedPostId = rawEpisode > 0 ? rawEpisode : null;

	// `?period=` lets the Episodes-tab plays-click open the drilldown at the
	// widest window. The show-level selection is still owned by local state.
	// Only preset periods are URL-addressable; a custom range stays in-memory.
	const urlPeriod = isPresetPeriod( search.period ) ? search.period : null;

	// Episodes-tab plays-clicks deep-link with only the id, so the title is
	// hydrated client-side via core-data.
	const { record: selectedPost } = useEntityRecord< {
		title?: { rendered?: string };
	} >( 'postType', 'post', selectedPostId ?? 0, { enabled: selectedPostId !== null } );

	const { data: stats, isLoading, isError } = useShowStatsQuery( selection );

	const handleSelect = useCallback(
		( item: PodcastStatsTopEpisode ) => {
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					episode: item.post_id,
					// Carry the preset period into the URL so refresh/share reopens
					// the drilldown at the same window. Custom ranges aren't
					// URL-addressable; the drilldown falls back to its default.
					period: selection.period !== 'custom' ? selection.period : undefined,
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate, selection.period ]
	);

	const handleBack = useCallback( () => {
		navigate( {
			search: ( prev: Record< string, unknown > ) => ( {
				...prev,
				episode: undefined,
				period: undefined,
			} ),
		} as unknown as Parameters< typeof navigate >[ 0 ] );
	}, [ navigate ] );

	// Return focus to the heading after leaving the drilldown; the back button has unmounted.
	const prevSelectedIdRef = useRef< number | null >( null );
	useEffect( () => {
		if ( prevSelectedIdRef.current !== null && selectedPostId === null ) {
			headingRef.current?.focus();
		}
		prevSelectedIdRef.current = selectedPostId;
	}, [ selectedPostId ] );

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

	if ( selectedPostId ) {
		// Prefer the resolved entity record; fall back to the top_episodes list
		// (already in memory) so the heading is correct immediately when the user
		// clicks from the in-page Top Episodes list, before useEntityRecord settles.
		const fallbackTitle =
			stats?.top_episodes?.find( ep => ep.post_id === selectedPostId )?.title ?? '';
		const title = selectedPost?.title?.rendered
			? decodeEntities( selectedPost.title.rendered )
			: fallbackTitle;
		return (
			<EpisodeStats
				postId={ selectedPostId }
				title={ title || __( '(Untitled)', 'jetpack-podcast' ) }
				onBack={ handleBack }
				initialSelection={ urlPeriod ? selectionFromPeriod( urlPeriod ) : selection }
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
						{ getPeriodHeading( selection ) }
					</h2>
					<p className="podcast-stats__section-description">
						{ __(
							'Track downloads, top episodes, apps, and listener locations.',
							'jetpack-podcast'
						) }
					</p>
				</header>
				<PeriodControl value={ selection } onChange={ setSelection } />
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
						<StatsTopEpisodes
							episodes={ stats?.top_episodes }
							isLoading={ isLoading }
							onSelect={ handleSelect }
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
