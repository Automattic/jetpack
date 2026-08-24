import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { DropZone, Spinner, Tooltip } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate, useSearch } from '@wordpress/route';
import { Button, VisuallyHidden } from '@wordpress/ui';
import CaptionManagerModal from '../../src/client/components/caption-manager-modal/lazy';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import FetchErrorNotice from '../../src/dashboard/components/fetch-error-notice';
import FreeTierNotice, {
	FREE_TIER_AT_LIMIT_MESSAGE,
	FREE_TIER_AT_LIMIT_NOTICE_ID,
} from '../../src/dashboard/components/free-tier-notice';
import { buildLibraryActions } from '../../src/dashboard/components/library/actions';
import { libraryFields } from '../../src/dashboard/components/library/fields';
import { UploadActionsProvider } from '../../src/dashboard/components/library/upload-actions-context';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import {
	describeRefusal,
	INVALID_FILE_NOTICE_ID,
	videoFileAccept,
} from '../../src/dashboard/components/upload-dropzone/video-files';
import UploadOnboarding, { UPLOAD_CONTEXT } from '../../src/dashboard/components/upload-onboarding';
import { DeleteVideosError, useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useLibrary } from '../../src/dashboard/hooks/use-library';
import { usePersistedView } from '../../src/dashboard/hooks/use-persisted-view';
import { useSetPrivacy } from '../../src/dashboard/hooks/use-set-privacy';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import { useUploadFromLibrary } from '../../src/dashboard/hooks/use-upload-from-library';
import { useVideoPressUpgrade } from '../../src/dashboard/hooks/use-videopress-upgrade';
import { createPromoteLocal } from './promote-local';
import { planVideoDrop } from './upload-drop';
import './style.scss';
import type { LibraryItem, LibraryItemPrivacy } from '../../src/dashboard/types/library';
import type { SupportedLayouts, View } from '@wordpress/dataviews';
import type { ChangeEvent } from 'react';

const PRIVACY_LABELS: Record< LibraryItemPrivacy, string > = {
	public: __( 'Public', 'jetpack-videopress-pkg' ),
	private: __( 'Private', 'jetpack-videopress-pkg' ),
	'site-default': __( 'Site default', 'jetpack-videopress-pkg' ),
};

// Grid tiles already lead with the thumbnail + title; the filename
// below repeats information the title implies and clutters the tile.
// Keep it hidden by default — users who want it can still toggle it
// on via the DataViews field-visibility control. The orientation
// indicator is icon-only, so it earns its spot on the tile.
const GRID_VISIBLE_FIELDS: string[] = [ 'orientation' ];
// `fileSize` is intentionally omitted: it's only populated for local
// (non-VideoPress) uploads today, so it's blank for most rows. Users
// who want the column can still toggle it on via the DataViews column-
// visibility control.
const TABLE_VISIBLE_FIELDS = [ 'filename', 'duration', 'orientation', 'uploadDate', 'privacy' ];

const DEFAULT_VIEW: View = {
	type: 'grid',
	page: 1,
	perPage: 12,
	titleField: 'title',
	mediaField: 'thumbnail',
	fields: GRID_VISIBLE_FIELDS,
	layout: { previewSize: 220, density: 'comfortable' },
	sort: { field: 'uploadDate', direction: 'desc' },
	filters: [],
	search: '',
};

const defaultLayouts: SupportedLayouts = {
	grid: { layout: { previewSize: 220, density: 'comfortable' } },
	table: { layout: { density: 'balanced' } },
};

// The whole library, unfiltered — `paginationInfo` on the user's own view is
// scoped to their filters and search, so it cannot answer "is anything left".
// Identical shape to the first-run count view, so the two share one query.
const TOTAL_COUNT_VIEW: View = {
	type: 'table',
	page: 1,
	perPage: 1,
	fields: [],
	filters: [],
	search: '',
	sort: { field: 'date', direction: 'desc' },
};

/**
 * Shape the Library's initial view from the route's search params.
 *
 * The welcome modal's "Move N videos over" button deep-links here with
 * `?type=local` so the user lands on exactly the videos that can move.
 * Seed-once only: the param shapes the INITIAL view (beating the persisted
 * one, which deliberately never stores filters), and normal filter
 * interaction owns the state from then on — the URL is not synced.
 *
 * @param initialView - The persisted-or-default view.
 * @param search      - Decoded route search params.
 * @return The view the Library should mount with.
 */
export function seedViewFromSearch( initialView: View, search: Record< string, unknown > ): View {
	if ( search?.type !== 'local' ) {
		return initialView;
	}

	return {
		...initialView,
		filters: [ { field: 'type', value: 'local', operator: 'is' } ],
	};
}

const StageInner = () => {
	const [ initialView, persistView ] = usePersistedView( DEFAULT_VIEW );
	// Read through the router, not window.location: inside wp-admin the app's
	// path (and its search) travels encoded in the `p` query param, so only
	// the router knows the decoded app-level search params.
	const search = useSearch( { strict: false } ) as Record< string, unknown >;
	const [ view, setView ] = useState< View >( () => seedViewFromSearch( initialView, search ) );
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ captionVideo, setCaptionVideo ] = useState< LibraryItem | null >( null );
	// Local IDs currently being promoted from local-storage to VideoPress,
	// mapped to the last upload percentage (0–100) reported by the chunked
	// upload-from-library endpoint, so their rows can show the same live
	// progress as a regular upload.
	const [ promotingProgress, setPromotingProgress ] = useState< Map< string, number > >(
		() => new Map()
	);
	// IDs currently being deleted. Same overlay technique as promotingProgress:
	// rows get a "Deleting…" state (thumbnail overlay in grid, title pill in
	// table) until the post-delete refetch removes them from the listing.
	const [ deletingIds, setDeletingIds ] = useState< Set< string > >( () => new Set() );

	const {
		items,
		isLoading,
		paginationInfo,
		isError,
		error: libraryError,
		refetch,
	} = useLibrary( view );
	const { paginationInfo: totalPagination, isLoading: isTotalLoading } =
		useLibrary( TOTAL_COUNT_VIEW );
	const libraryTotalRef = useRef( 0 );
	libraryTotalRef.current = totalPagination?.totalItems ?? 0;
	const { uploadQueue, startUpload, retryUpload } = useUpload();

	// Whether this mount shows the upload onboarding flow instead of the
	// listing: the user has no videos, so upload *is* the page. Decided ONCE
	// per mount when the unfiltered count settles — the same freeze
	// DashboardLayout applies to the tab order, and for the same reason: the
	// first upload flips the count mid-flow, and an unfrozen check would yank
	// the flow out from under the user the moment their upload succeeds. A
	// strict `=== 0` (not `?? 0`) so a failed count request reads as "show the
	// listing", never as an empty library.
	//
	// A queue holding anything but this flow's own single-upload session means
	// the listing owns the surface already (a batch's in-flight rows render
	// there); the flow's own rows are adopted by the flow on mount instead.
	const showOnboardingRef = useRef< boolean | null >( null );
	if ( showOnboardingRef.current === null && ! isTotalLoading ) {
		showOnboardingRef.current =
			totalPagination?.totalItems === 0 &&
			! uploadQueue.some( item => item.context !== UPLOAD_CONTEXT );
	}
	// The flow's own exit: a multi-file batch has no surface in the flow, so it
	// hands the page back to the listing and the in-flight rows take over.
	const [ onboardingDismissed, setOnboardingDismissed ] = useState( false );
	const exitOnboarding = useCallback( () => setOnboardingDismissed( true ), [] );
	const showOnboarding = ! onboardingDismissed && showOnboardingRef.current === true;
	// The listing owns the header action, the at-limit notice, and the page
	// dropzone only once it is actually the surface being shown.
	const listingOwnsSurface = onboardingDismissed || showOnboardingRef.current === false;
	const { mutateAsync: deleteVideo } = useDeleteVideo();
	const { mutateAsync: setPrivacyAsync } = useSetPrivacy();
	const { mutateAsync: uploadFromLibrary } = useUploadFromLibrary();
	const {
		isAtLimit,
		isFree,
		isUnlimited,
		videoCount,
		limit,
		isSettled: isPlanSettled,
	} = useFreeTier();
	const runUpgrade = useVideoPressUpgrade();

	const onChangeView = useCallback(
		( next: View ) => {
			setView( current => {
				const resolved =
					next.type === current.type
						? next
						: {
								...next,
								fields: next.type === 'table' ? TABLE_VISIBLE_FIELDS : GRID_VISIBLE_FIELDS,
						  };
				persistView( resolved );
				return resolved;
			} );
		},
		[ persistView ]
	);

	const filePickerRef = useRef< HTMLInputElement >( null );
	const onClickHeaderUpload = useCallback( () => {
		if ( isAtLimit ) {
			return;
		}
		filePickerRef.current?.click();
	}, [ isAtLimit ] );

	const navigate = useNavigate();

	const openVideoDetails = useCallback(
		( id: string ) => {
			navigate( { href: `/video/${ id }` } );
		},
		[ navigate ]
	);

	const { createSuccessNotice, createErrorNotice, createInfoNotice } = useGlobalNotices();

	// Shared multi-file entry point for both the DropZone and the header
	// "Upload video" file picker. Enforces the free-tier cap up front so
	// neither path can sneak past the limit the picker button guards.
	const handleFilesSelected = useCallback(
		async ( files: File[] ) => {
			const decision = await planVideoDrop( files, {
				isFree,
				isUnlimited,
				limit,
				videoCount,
			} );

			// Both refusals carry a stable id so repeated blocked attempts
			// refresh one snackbar instead of stacking a column of identical
			// ones — the same technique the delete notices below use.
			if ( decision.kind === 'no-videos' ) {
				// Derived from the files, not a fixed string: a genuine `.webm` is a
				// video this backend can't take, and telling its owner "Only video
				// files can be uploaded" is false.
				createErrorNotice( await describeRefusal( files ), {
					id: INVALID_FILE_NOTICE_ID,
				} );
				return;
			}

			if ( decision.kind === 'at-limit' ) {
				createErrorNotice( FREE_TIER_AT_LIMIT_MESSAGE, {
					id: FREE_TIER_AT_LIMIT_NOTICE_ID,
					actions: [ { label: __( 'Upgrade', 'jetpack-videopress-pkg' ), onClick: runUpgrade } ],
				} );
				return;
			}

			decision.toUpload.forEach( file => startUpload( file ) );

			if ( decision.skipped > 0 ) {
				createErrorNotice(
					sprintf(
						/* translators: %d: number of videos that could not be uploaded because the plan limit was reached. */
						_n(
							'%d video wasn’t uploaded because it exceeds your plan’s limit.',
							'%d videos weren’t uploaded because they exceed your plan’s limit.',
							decision.skipped,
							'jetpack-videopress-pkg'
						),
						decision.skipped
					)
				);
			}
		},
		[ isFree, isUnlimited, limit, videoCount, startUpload, createErrorNotice, runUpgrade ]
	);

	const onFilePicked = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			const files = Array.from( event.target.files ?? [] );
			if ( files.length > 0 ) {
				// `void`: the decision settles a microtask later (the filter reads
				// each file's header); clearing the input must not wait on it, or
				// picking the same file twice would fire no second change event.
				void handleFilesSelected( files );
			}
			event.target.value = '';
		},
		[ handleFilesSelected ]
	);

	// DropZone hands files to a void callback; the decision is asynchronous.
	const onFilesDrop = useCallback(
		( files: File[] ) => void handleFilesSelected( files ),
		[ handleFilesSelected ]
	);

	// The factory owns the in-flight progress map (re-entry guard + overlay
	// snapshots, chunk progress folded in) and reacts via the mutateAsync
	// promise; see promote-local.ts for why.
	// Deliberately created ONCE per stage instance: useGlobalNotices() returns
	// fresh wrapper closures every render, so a dep-keyed useMemo would rebuild
	// the factory (emptying its in-flight state) on each render — including the
	// renders its own publishes trigger. All captured deps are stable: the
	// notice wrappers forward to registry-bound dispatchers, mutateAsync is
	// referentially stable in TanStack v5, and state setters never change.
	const [ promoteLocal ] = useState( () =>
		createPromoteLocal( {
			promote: uploadFromLibrary,
			createSuccessNotice,
			createErrorNotice,
			onPromotingChange: setPromotingProgress,
		} )
	);

	const actions = useMemo(
		() =>
			buildLibraryActions( {
				promoteLocal,
				retryUpload,
				openVideoDetails,
				manageCaptions: ( item: LibraryItem ) => {
					setCaptionVideo( item );
				},
				deleteItems: async ( ids: string[] ) => {
					// DELETE …?force=true — permanent, no trash. One prompt per
					// batch rather than per row: DataViews hands the whole
					// selection to this callback at once, and a prompt per video
					// would be the same question five times.
					const confirmed =
						// eslint-disable-next-line no-alert -- deliberate synchronous guard on an irreversible action.
						window.confirm(
							sprintf(
								/* translators: %d: number of videos to delete. */
								_n(
									'Permanently delete %d video?',
									'Permanently delete %d videos?',
									ids.length,
									'jetpack-videopress-pkg'
								),
								ids.length
							)
						);
					if ( ! confirmed ) {
						return;
					}
					// Read before the delete: after it, the count has moved.
					const wasWholeLibrary = libraryTotalRef.current <= ids.length;
					setDeletingIds( prev => new Set( [ ...prev, ...ids ] ) );
					// The row overlay/pill is purely visual; this notice is what
					// announces the in-flight state to screen readers. Per-batch id
					// (rows mid-delete are ineligible for another delete, so the
					// first id can't repeat across concurrent batches) lets the
					// settle notices below replace it in place rather than stack.
					const noticeId = `vp-library-deleting-${ ids[ 0 ] }-${ ids.length }`;
					createInfoNotice(
						sprintf(
							/* translators: %d: number of videos being deleted. */
							_n(
								'Deleting %d video…',
								'Deleting %d videos…',
								ids.length,
								'jetpack-videopress-pkg'
							),
							ids.length
						),
						{ id: noticeId, explicitDismiss: true }
					);
					// React via the mutateAsync promise, not mutate-level callbacks:
					// those are dropped if another delete starts while this one is in
					// flight (TanStack detaches the observer), which would strand
					// rows in the "Deleting…" state. The promise settles only after
					// the hook's awaited library refetch, so the cleanup below can't
					// flash rows back to their normal state ahead of their removal
					// from the listing.
					let failedIds = new Set< string >();
					try {
						await deleteVideo( ids );
						createSuccessNotice(
							sprintf(
								/* translators: %d: number of deleted videos. */
								_n(
									'%d video deleted.',
									'%d videos deleted.',
									ids.length,
									'jetpack-videopress-pkg'
								),
								ids.length
							),
							{ id: noticeId }
						);
					} catch ( error ) {
						// Unknown error shape → assume nothing was deleted.
						failedIds =
							error instanceof DeleteVideosError
								? new Set( error.failedIds.map( String ) )
								: new Set( ids );
						createErrorNotice(
							sprintf(
								/* translators: %d: number of videos that could not be deleted. */
								_n(
									'Failed to delete %d video.',
									'Failed to delete %d videos.',
									failedIds.size,
									'jetpack-videopress-pkg'
								),
								failedIds.size
							),
							{ id: noticeId }
						);
					}
					setDeletingIds( prev => {
						const next = new Set( prev );
						ids.forEach( id => next.delete( id ) );
						return next;
					} );
					// Prune rows that are now gone from the DataViews selection so
					// the bulk-actions toolbar doesn't keep counting them. On partial
					// failure the failed rows survive and stay selected.
					const requested = new Set( ids );
					setSelection( prev => prev.filter( id => ! requested.has( id ) || failedIds.has( id ) ) );
					// An emptied Library is not a dead end: its empty state is
					// the upload onboarding flow, so swap it back in rather than
					// leaving a "no results" grid with nothing to do next.
					if ( wasWholeLibrary && failedIds.size === 0 ) {
						showOnboardingRef.current = true;
						setOnboardingDismissed( false );
					}
				},
				setPrivacy: ( ids: string[], privacy: LibraryItemPrivacy ) => {
					// Batch through useSetPrivacy: each id is POSTed individually so one
					// failure doesn't abort the rest, and the result reports which ids
					// succeeded vs. failed so we can surface an accurate notice.
					setPrivacyAsync( { ids, privacy } )
						.then( ( { succeeded, failed } ) => {
							if ( failed.length === 0 ) {
								createSuccessNotice(
									sprintf(
										/* translators: 1: number of videos updated. 2: new privacy label, e.g. "Public". */
										_n(
											'%1$d video set to %2$s.',
											'%1$d videos set to %2$s.',
											succeeded.length,
											'jetpack-videopress-pkg'
										),
										succeeded.length,
										PRIVACY_LABELS[ privacy ]
									)
								);
								return;
							}

							if ( succeeded.length === 0 ) {
								createErrorNotice(
									_n(
										'Failed to update privacy.',
										'Failed to update privacy for the selected videos.',
										failed.length,
										'jetpack-videopress-pkg'
									)
								);
								return;
							}

							createErrorNotice(
								sprintf(
									/* translators: 1: number of videos updated. 2: number of videos that could not be updated. */
									__(
										'Privacy updated for %1$d video; %2$d could not be updated.',
										'jetpack-videopress-pkg'
									),
									succeeded.length,
									failed.length
								)
							);
						} )
						.catch( () => {
							createErrorNotice( __( 'Failed to update privacy.', 'jetpack-videopress-pkg' ) );
						} );
				},
			} ),
		[
			promoteLocal,
			retryUpload,
			deleteVideo,
			setPrivacyAsync,
			openVideoDetails,
			createSuccessNotice,
			createErrorNotice,
			createInfoNotice,
		]
	);

	// Splice in-flight uploads at the top of the listing so the user sees
	// their upload immediately, before the next server refetch.
	const renderedItems = useMemo< LibraryItem[] >( () => {
		const inFlight: LibraryItem[] = uploadQueue
			.filter( u => u.status === 'pending' || u.status === 'uploading' || u.status === 'failed' )
			.map( u => ( {
				id: u.id,
				guid: '',
				type: 'local' as const,
				title: u.file.name.replace( /\.[^.]+$/, '' ),
				filename: u.file.name,
				thumbnailUrl: null,
				durationSeconds: 0,
				// The enqueue time, not now: a date rebuilt on every render walks
				// forward while the row is on screen, and this listing sorts by it.
				uploadDate: u.enqueuedAt,
				privacy: 'site-default' as LibraryItemPrivacy,
				isPrivate: false,
				fileSizeBytes: u.file.size,
				upload: {
					status: u.status === 'failed' ? ( 'failed' as const ) : ( 'uploading' as const ),
					progress: Math.round( u.progress * 100 ),
				},
				description: '',
				rating: 'G' as LibraryItem[ 'rating' ],
				displayEmbed: false,
				allowDownloads: false,
				shortcode: '',
				isProcessing: false,
				orientation: null,
				tracks: [],
			} ) );
		// Overlay an in-flight state on items currently being promoted from
		// local-storage to VideoPress or being deleted, so the title-cell
		// pill and the thumbnail overlay reflect the operation without
		// needing a parallel signal at every render site.
		const overlaid = items.map( item => {
			const promoting = promotingProgress.get( item.id );
			if ( promoting !== undefined ) {
				return { ...item, upload: { status: 'promoting' as const, progress: promoting } };
			}
			if ( deletingIds.has( item.id ) ) {
				return { ...item, upload: { status: 'deleting' as const, progress: 0 } };
			}
			return item;
		} );
		return [ ...inFlight, ...overlaid ];
	}, [ uploadQueue, items, promotingProgress, deletingIds ] );

	const getItemId = useCallback( ( item: LibraryItem ) => item.id, [] );

	const onCaptionTracksChange = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	// The viewport's four mutually exclusive surfaces, flattened out of nested
	// ternaries so each branch can say why it exists.
	const renderViewport = () => {
		// A failed listing request would otherwise render as DataViews'
		// "No results" — indistinguishable from an empty library. Surface
		// the error explicitly with a Retry that refetches. Only when the
		// QUERY has nothing valid to show: a failed *background* refresh
		// keeps its cached rows (grid stays, self-heals on the next
		// poll), while a failed view change / first load leaves data
		// undefined (react-query drops keepPreviousData placeholders on
		// error), so it lands here. Deliberately `items`, not
		// `renderedItems` — the latter splices in in-flight upload rows,
		// which must not mask a failed listing.
		if ( isError && items.length === 0 ) {
			return (
				<FetchErrorNotice
					className="vp-library__error"
					message={ __( 'We couldn’t load your video library.', 'jetpack-videopress-pkg' ) }
					error={ libraryError }
					onRetry={ () => void refetch() }
				/>
			);
		}

		// The empty-vs-listing decision is pending (the unfiltered count hasn't
		// settled). Painting the grid skeleton and then swapping in the
		// onboarding flow reads as the page loading twice, so hold the surface
		// with an explicit wait instead.
		if ( showOnboardingRef.current === null ) {
			return (
				<div className="vp-library__deciding" role="status">
					<Spinner />
					<VisuallyHidden>{ __( 'Loading…', 'jetpack-videopress-pkg' ) }</VisuallyHidden>
				</div>
			);
		}

		if ( showOnboarding ) {
			return <UploadOnboarding onExitToLibrary={ exitOnboarding } />;
		}

		return (
			<DataViews< LibraryItem >
				data={ renderedItems }
				fields={ libraryFields }
				actions={ actions }
				view={ view }
				onChangeView={ onChangeView }
				selection={ selection }
				onChangeSelection={ setSelection }
				getItemId={ getItemId }
				paginationInfo={ paginationInfo }
				isLoading={ isLoading }
				defaultLayouts={ defaultLayouts }
			/>
		);
	};

	return (
		<DashboardLayout
			activeTab="library"
			hideFooter
			// While the onboarding flow is the page, its single-upload edit
			// session's player slot is the progress surface, so the shared
			// upload pill stands down for the flow's own queue items — the
			// same suppression the old /upload route passed.
			uploadPillSuppressContext={ showOnboarding ? UPLOAD_CONTEXT : undefined }
			// `isAtLimit` is false until the plan count lands, so a button
			// painted before then reads `aria-disabled=false` on a site that is
			// at its limit — briefly live, and refusing the click it invited.
			// Home already holds its copy of this button back until it has
			// something true to say; this one waits for the count that decides
			// its state, and arrives alongside the grid it sits above.
			// `listingOwnsSurface`: while the onboarding flow is the page, its
			// dropzone is the one upload affordance — a second one in the
			// header would race it.
			actions={
				isPlanSettled && listingOwnsSurface ? (
					<>
						<input
							ref={ filePickerRef }
							type="file"
							// The allow-list, not `video/*`, which offered `.webm`
							// and `.mkv` — real videos this backend refuses — and
							// then had to turn them away after the user had picked
							// one. Same attribute, same reason, as the shared
							// dropzone's input.
							accept={ videoFileAccept() }
							// The capped free tier can only ever host `limit` videos, so
							// multi-select there would only produce skipped-file notices;
							// paid and grandfathered-unlimited plans get bulk selection.
							multiple={ ! isFree || isUnlimited }
							style={ { display: 'none' } }
							onChange={ onFilePicked }
						/>
						<Tooltip
							text={
								isAtLimit
									? FREE_TIER_AT_LIMIT_MESSAGE
									: __( 'Upload a new video', 'jetpack-videopress-pkg' )
							}
						>
							<Button
								className="vp-library__upload-button"
								size="compact"
								onClick={ onClickHeaderUpload }
								aria-disabled={ isAtLimit }
							>
								{ __( 'Upload video', 'jetpack-videopress-pkg' ) }
							</Button>
						</Tooltip>
					</>
				) : undefined
			}
		>
			{ /* The flow's UploadCard renders its own at-limit notice, so the
			     listing's copy stands down while the flow is the page. */ }
			{ isAtLimit && listingOwnsSurface && (
				<div className="vp-library__notice">
					<FreeTierNotice />
				</div>
			) }
			<UploadActionsProvider value={ { promoteLocal, retryUpload, openVideoDetails } }>
				<div className={ `vp-library__viewport vp-library__viewport--${ view.type }` }>
					{ /* The flow brings its own dropzone; two drop targets on one
					     page would fight over the same files. */ }
					{ listingOwnsSurface && (
						<DropZone
							label={ __( 'Drop videos to upload', 'jetpack-videopress-pkg' ) }
							onFilesDrop={ onFilesDrop }
						/>
					) }
					{ renderViewport() }
				</div>
			</UploadActionsProvider>
			{ captionVideo && (
				<CaptionManagerModal
					isOpen={ !! captionVideo }
					guid={ captionVideo.guid }
					title={ captionVideo.title }
					poster={ captionVideo.thumbnailUrl }
					isPrivate={ captionVideo.isPrivate }
					tracks={ captionVideo.tracks }
					onClose={ () => setCaptionVideo( null ) }
					onTracksChange={ onCaptionTracksChange }
				/>
			) }
		</DashboardLayout>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
