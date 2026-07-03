import { DataViews } from '@wordpress/dataviews';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import { DEFAULT_VIDEOS_PER_PAGE, useYouTubeVideos } from '../../hooks/use-youtube-videos';
import { importPickerFields } from './fields';
import type { YouTubeVideo } from '../../hooks/use-youtube-videos';
import type { Action, SupportedLayouts, View } from '@wordpress/dataviews';

const DEFAULT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: DEFAULT_VIDEOS_PER_PAGE,
	titleField: 'title',
	mediaField: 'thumbnail',
	fields: [ 'duration', 'published', 'privacy' ],
	layout: { density: 'balanced' },
	sort: undefined,
	filters: [],
	search: '',
};

// Table only: the picker is a transient selection flow, not a browsing
// surface, so it doesn't offer the grid layout the library has.
const defaultLayouts: SupportedLayouts = {
	table: { layout: { density: 'balanced' } },
};

type Props = {
	/** Connected account name, shown above the listing. */
	accountName: string;
	/** Called with the selected (not-yet-imported) videos to start an import. */
	onImport: ( videos: YouTubeVideo[] ) => void;
	/** True while the import POST is in flight; disables the CTA. */
	isStarting: boolean;
};

/**
 * DataViews table of the connected channel's uploads with multi-select and an
 * "Import N videos" primary action.
 *
 * The listing is cursor-paginated: the server only hands out an opaque
 * `next_page_token`, so DataViews' numbered pagination is mapped onto the
 * infinite query by slicing the flattened pages and fetching the next page
 * whenever the view asks for rows that aren't loaded yet. Totals are unknown
 * until the last page, so the pagination info reports one extra item/page as
 * long as another page exists.
 *
 * @param props             - Component props.
 * @param props.accountName - Connected account name, shown above the listing.
 * @param props.onImport    - Called with the selected videos to start an import.
 * @param props.isStarting  - True while the import POST is in flight.
 * @return The picker element.
 */
export default function ImportPicker( { accountName, onImport, isStarting }: Props ) {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ selection, setSelection ] = useState< string[] >( [] );

	const { videos, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useYouTubeVideos();

	const page = view.page ?? 1;
	const perPage = view.perPage ?? DEFAULT_VIDEOS_PER_PAGE;
	const needed = page * perPage;

	// Cursor → numbered-page adapter: whenever the view wants rows beyond
	// what's loaded and the server has more, pull the next page. Depending on
	// videos.length chains the effect until the requested page is satisfied
	// (the view's perPage can exceed the server's page size).
	useEffect( () => {
		if ( videos.length < needed && hasNextPage && ! isFetchingNextPage ) {
			fetchNextPage();
		}
	}, [ videos.length, needed, hasNextPage, isFetchingNextPage, fetchNextPage ] );

	const pageItems = useMemo(
		() => videos.slice( ( page - 1 ) * perPage, needed ),
		[ videos, page, perPage, needed ]
	);

	const paginationInfo = useMemo( () => {
		const knownPages = Math.ceil( videos.length / perPage );
		return {
			// The true totals are unknown until the cursor runs out; advertise
			// one extra item/page so the pagination controls keep a "next".
			totalItems: videos.length + ( hasNextPage ? 1 : 0 ),
			totalPages: hasNextPage ? knownPages + 1 : knownPages,
		};
	}, [ videos.length, perPage, hasNextPage ] );

	// Rows already imported are excluded here (and via the action's
	// isEligible), so the CTA only ever submits importable ids. The server is
	// idempotent about duplicates anyway; this just keeps the count honest.
	const selectedVideos = useMemo( () => {
		const selected = new Set( selection );
		return videos.filter( video => selected.has( video.externalId ) && ! video.alreadyImported );
	}, [ videos, selection ] );

	const importSelection = useCallback( () => {
		if ( selectedVideos.length > 0 ) {
			onImport( selectedVideos );
		}
	}, [ selectedVideos, onImport ] );

	const actions = useMemo< Action< YouTubeVideo >[] >(
		() => [
			{
				id: 'import',
				label: __( 'Import', 'jetpack-videopress-pkg' ),
				supportsBulk: true,
				isEligible: item => ! item.alreadyImported,
				callback: items => onImport( items ),
			},
		],
		[ onImport ]
	);

	const getItemId = useCallback( ( item: YouTubeVideo ) => item.externalId, [] );

	return (
		<Stack direction="column" gap="md" className="vp-import__picker">
			<Stack direction="row" align="center" justify="space-between" className="vp-import__toolbar">
				<Text variant="body-sm" className="vp-import__account">
					{ accountName
						? sprintf(
								/* translators: %s: connected YouTube account name. */
								__( 'Importing from %s', 'jetpack-videopress-pkg' ),
								accountName
						  )
						: __( 'Importing from YouTube', 'jetpack-videopress-pkg' ) }
				</Text>
				<Button
					className="vp-import__import-button"
					disabled={ selectedVideos.length === 0 || isStarting }
					onClick={ importSelection }
				>
					{ selectedVideos.length > 0
						? sprintf(
								/* translators: %d: number of selected videos. */
								_n(
									'Import %d video',
									'Import %d videos',
									selectedVideos.length,
									'jetpack-videopress-pkg'
								),
								selectedVideos.length
						  )
						: __( 'Import videos', 'jetpack-videopress-pkg' ) }
				</Button>
			</Stack>
			<div className="vp-import__viewport">
				<DataViews< YouTubeVideo >
					data={ pageItems }
					fields={ importPickerFields }
					actions={ actions }
					view={ view }
					onChangeView={ setView }
					selection={ selection }
					onChangeSelection={ setSelection }
					getItemId={ getItemId }
					paginationInfo={ paginationInfo }
					isLoading={ isLoading || ( pageItems.length === 0 && isFetchingNextPage ) }
					defaultLayouts={ defaultLayouts }
					search={ false }
					empty={
						<Text>{ __( 'No videos found in this account.', 'jetpack-videopress-pkg' ) }</Text>
					}
				/>
			</div>
		</Stack>
	);
}
