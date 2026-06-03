// Duration and plays come from the wpcom episode-totals endpoint and are
// merged client-side, so those columns are display-only (not sortable).

import { getSiteData } from '@automattic/jetpack-script-data';
import { Button } from '@wordpress/components';
import { DataViews, type Action, type View, type ViewTable } from '@wordpress/dataviews';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import './style.scss';
import { useEpisodeStatsQuery } from './use-episode-stats-query';
import { useEpisodesQuery } from './use-episodes-query';
import type { EpisodeStats, TabName } from '../types';

const ADMIN_URL = getSiteData()?.admin_url ?? '/wp-admin/';

const editPostUrl = ( postId: number ): string =>
	`${ ADMIN_URL }post.php?action=edit&post=${ postId }`;

// Server-side filters key off `?podcast_episode=1` to apply the configured
// podcast category (and, on Premium, prefill the Podcast Episode block).
const NEW_EPISODE_URL = `${ ADMIN_URL }post-new.php?podcast_episode=1`;

const EmptyEpisodes = () => (
	<div className="podcast__empty-state">
		<h2 className="podcast__section-heading">
			{ __( 'No podcast episodes yet.', 'jetpack-podcast' ) }
		</h2>
		<p>
			{ __( 'Publish a podcast post in your chosen category to see it here.', 'jetpack-podcast' ) }
		</p>
		<Button variant="primary" href={ NEW_EPISODE_URL }>
			{ __( 'Create episode', 'jetpack-podcast' ) }
		</Button>
	</div>
);

interface EpisodeRow {
	id: number;
	title: string;
	date: string;
	status: string;
	link: string;
	featuredMediaUrl: string;
	playsAll: number;
	durationSeconds: number | null;
}

const formatDuration = ( seconds: number | null ): string => {
	if ( seconds == null || seconds <= 0 ) {
		return '—';
	}
	const h = Math.floor( seconds / 3600 );
	const m = Math.floor( ( seconds % 3600 ) / 60 );
	const s = seconds % 60;
	const pad = ( n: number ) => String( n ).padStart( 2, '0' );
	return h > 0 ? `${ h }:${ pad( m ) }:${ pad( s ) }` : `${ m }:${ pad( s ) }`;
};

const defaultView: ViewTable = {
	type: 'table',
	titleField: 'title',
	mediaField: 'media',
	showTitle: true,
	showMedia: true,
	fields: [ 'duration', 'plays', 'date', 'status' ],
	page: 1,
	perPage: 20,
	sort: { field: 'date', direction: 'desc' },
	layout: {
		styles: {
			media: { width: '72px' },
			title: { width: 'auto', minWidth: '260px' },
			duration: { width: '110px' },
			plays: { width: '120px' },
			date: { width: '150px' },
			status: { width: '140px' },
		},
	},
};

const getEpisodeRowId = ( item: EpisodeRow ) => String( item.id );

type PlaysCellProps = {
	count: number;
	episodeId: number;
	episodeTitle: string;
	onOpen: ( episodeId: number ) => void;
};

const PlaysCell = ( { count, episodeId, episodeTitle, onOpen }: PlaysCellProps ) => {
	const handleClick = useCallback( () => onOpen( episodeId ), [ onOpen, episodeId ] );
	return count > 0 ? (
		<Button
			variant="link"
			onClick={ handleClick }
			aria-label={ sprintf(
				/* translators: %s: episode title */
				__( 'View stats for %s', 'jetpack-podcast' ),
				episodeTitle || __( '(Untitled)', 'jetpack-podcast' )
			) }
		>
			{ count }
		</Button>
	) : (
		<>{ count }</>
	);
};

const STATUS_LABELS: Record< string, string > = {
	publish: __( 'Published', 'jetpack-podcast' ),
	future: __( 'Scheduled', 'jetpack-podcast' ),
	draft: __( 'Draft', 'jetpack-podcast' ),
	pending: __( 'Pending review', 'jetpack-podcast' ),
	private: __( 'Private', 'jetpack-podcast' ),
};

const EpisodesTab = () => {
	const { data: settings } = usePodcastSettings();
	const categoryId = settings?.podcasting_category_id ?? 0;
	const showCoverImage = settings?.podcasting_image ?? '';

	const [ view, setView ] = useState< View >( defaultView );

	const navigate = useNavigate();

	const openEpisodeStats = useCallback(
		( episodeId: number ) => {
			const tab: TabName = 'stats';
			navigate( {
				search: ( prev: Record< string, unknown > ) => ( {
					...prev,
					tab,
					episode: episodeId,
					// Episodes tab shows all-time plays, so open the drilldown at the
					// widest window the episode endpoint supports ("Last year").
					period: 'all',
				} ),
			} as unknown as Parameters< typeof navigate >[ 0 ] );
		},
		[ navigate ]
	);

	const queryArgs = useMemo( () => {
		const sortField = view.sort?.field;
		const orderBy = sortField === 'title' || sortField === 'date' ? sortField : 'date';
		const order = view.sort?.direction === 'asc' ? 'asc' : 'desc';
		const statusFilter = view.filters?.find( filter => filter.field === 'status' );
		const status =
			typeof statusFilter?.value === 'string' && statusFilter.value ? statusFilter.value : 'any';

		return {
			categoryId,
			page: view.page ?? 1,
			perPage: view.perPage ?? 20,
			orderBy: orderBy as 'date' | 'title',
			order: order as 'asc' | 'desc',
			search: view.search ?? '',
			status,
		};
	}, [ categoryId, view ] );

	const { data: episodesPage, isLoading } = useEpisodesQuery( queryArgs );
	// Memoised so the `?? []` fallback doesn't churn dependent useMemos.
	const posts = useMemo( () => episodesPage?.episodes ?? [], [ episodesPage ] );

	const postIds = useMemo( () => posts.map( p => p.id ), [ posts ] );
	const { data: stats = [] } = useEpisodeStatsQuery( postIds );

	const statsByPostId = useMemo( () => {
		const m = new Map< number, EpisodeStats >();
		for ( const s of stats ) {
			m.set( s.post_id, s );
		}
		return m;
	}, [ stats ] );

	const rows = useMemo< EpisodeRow[] >( () => {
		return posts.map( post => {
			const media = post._embedded?.[ 'wp:featuredmedia' ]?.[ 0 ];
			const sizes = media?.media_details?.sizes;
			const thumbnail =
				sizes?.thumbnail?.source_url ??
				sizes?.medium?.source_url ??
				media?.source_url ??
				showCoverImage;
			const stat = statsByPostId.get( post.id );
			return {
				id: post.id,
				title: decodeEntities( post.title?.rendered ?? '' ),
				date: post.date,
				status: post.status,
				link: post.link,
				featuredMediaUrl: thumbnail,
				playsAll: stat?.plays_all ?? 0,
				durationSeconds: stat?.duration_seconds ?? null,
			};
		} );
	}, [ posts, statsByPostId, showCoverImage ] );

	const fields = useMemo(
		() => [
			{
				id: 'media',
				label: __( 'Featured image', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.featuredMediaUrl,
				render: ( { item }: { item: EpisodeRow } ) =>
					item.featuredMediaUrl ? (
						<div className="podcast__episode-thumb">
							<img src={ item.featuredMediaUrl } alt="" className="podcast__episode-thumb__image" />
						</div>
					) : (
						<div
							className="podcast__episode-thumb podcast__episode-thumb--placeholder"
							aria-hidden="true"
						/>
					),
				enableHiding: false,
				enableSorting: false,
			},
			{
				id: 'title',
				label: __( 'Title', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.title,
				render: ( { item }: { item: EpisodeRow } ) => (
					<a href={ editPostUrl( item.id ) }>
						{ item.title || __( '(Untitled)', 'jetpack-podcast' ) }
					</a>
				),
				enableHiding: false,
				enableSorting: true,
				enableGlobalSearch: true,
			},
			{
				id: 'duration',
				type: 'integer' as const,
				label: __( 'Duration', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.durationSeconds ?? 0,
				render: ( { item }: { item: EpisodeRow } ) => formatDuration( item.durationSeconds ),
				enableSorting: false,
			},
			{
				id: 'plays',
				type: 'integer' as const,
				label: __( 'Plays', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.playsAll,
				render: ( { item }: { item: EpisodeRow } ) => (
					<PlaysCell
						count={ item.playsAll }
						episodeId={ item.id }
						episodeTitle={ item.title }
						onOpen={ openEpisodeStats }
					/>
				),
				enableSorting: false,
			},
			{
				id: 'date',
				type: 'datetime' as const,
				label: __( 'Date', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.date,
				format: { datetime: 'M j, Y' },
				enableSorting: true,
			},
			{
				id: 'status',
				label: __( 'Status', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.status,
				render: ( { item }: { item: EpisodeRow } ) => STATUS_LABELS[ item.status ] ?? item.status,
				elements: Object.entries( STATUS_LABELS ).map( ( [ value, label ] ) => ( {
					value,
					label,
				} ) ),
				filterBy: { operators: [ 'is' as const ] },
				enableSorting: true,
			},
		],
		[ openEpisodeStats ]
	);

	const actions = useMemo< Action< EpisodeRow >[] >(
		() => [
			{
				id: 'edit',
				label: __( 'Edit', 'jetpack-podcast' ),
				callback: ( items: EpisodeRow[] ) => {
					const item = items[ 0 ];
					if ( item ) {
						window.location.href = editPostUrl( item.id );
					}
				},
			},
			{
				id: 'view',
				label: __( 'View', 'jetpack-podcast' ),
				callback: ( items: EpisodeRow[] ) => {
					const item = items[ 0 ];
					if ( item?.link ) {
						window.open( item.link, '_blank', 'noopener,noreferrer' );
					}
				},
			},
		],
		[]
	);

	if ( ! categoryId ) {
		return (
			<div className="podcast__empty-state">
				<h2 className="podcast__section-heading">
					{ __( 'No podcast episodes yet.', 'jetpack-podcast' ) }
				</h2>
				<p>
					{ __(
						'Set a podcast category in your podcasting settings to start showing episodes here.',
						'jetpack-podcast'
					) }
				</p>
			</div>
		);
	}

	// Only show the CTA empty state when the table is empty for real; under an
	// active search/filter, let DataViews render its own "no results" UI.
	const hasFiltersOrSearch = !! view.search || ( view.filters?.length ?? 0 ) > 0;

	return (
		<DataViews< EpisodeRow >
			data={ rows }
			fields={ fields }
			view={ view }
			onChangeView={ setView }
			actions={ actions }
			paginationInfo={ {
				totalItems: episodesPage?.total ?? 0,
				totalPages: episodesPage?.totalPages ?? 0,
			} }
			getItemId={ getEpisodeRowId }
			isLoading={ isLoading }
			defaultLayouts={ { table: {} } }
			empty={ hasFiltersOrSearch ? undefined : <EmptyEpisodes /> }
			search
		/>
	);
};

export default EpisodesTab;
