// Duration and plays come from the wpcom episode-totals endpoint and are
// merged client-side, so those columns are display-only (not sortable).

import { getSiteData } from '@automattic/jetpack-script-data';
import { DataViews, type Action, type View, type ViewTable } from '@wordpress/dataviews';
import { useMemo, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { usePodcastSettings } from '../hooks/use-podcast-settings';
import './style.scss';
import { useEpisodeStatsQuery } from './use-episode-stats-query';
import { useEpisodesQuery } from './use-episodes-query';
import type { EpisodeStats } from '../types';

const ADMIN_URL = getSiteData()?.admin_url ?? '/wp-admin/';

const editPostUrl = ( postId: number ): string =>
	`${ ADMIN_URL }post.php?action=edit&post=${ postId }`;

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

	const [ view, setView ] = useState< View >( defaultView );

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
				sizes?.thumbnail?.source_url ?? sizes?.medium?.source_url ?? media?.source_url ?? '';
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
	}, [ posts, statsByPostId ] );

	const fields = useMemo(
		() => [
			{
				id: 'media',
				label: __( 'Featured image', 'jetpack-podcast' ),
				getValue: ( { item }: { item: EpisodeRow } ) => item.featuredMediaUrl,
				render: ( { item }: { item: EpisodeRow } ) =>
					item.featuredMediaUrl ? (
						<img src={ item.featuredMediaUrl } alt="" className="podcast__episode-thumb" />
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
		[]
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
			search
		/>
	);
};

export default EpisodesTab;
