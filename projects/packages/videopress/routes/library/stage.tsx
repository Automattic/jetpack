import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { DropZone, Tooltip } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button } from '@wordpress/ui';
import CaptionManagerModal from '../../src/client/components/caption-manager-modal/lazy';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import { buildLibraryActions } from '../../src/dashboard/components/library/actions';
import { libraryFields } from '../../src/dashboard/components/library/fields';
import { UploadActionsProvider } from '../../src/dashboard/components/library/upload-actions-context';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { DeleteVideosError, useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useLibrary } from '../../src/dashboard/hooks/use-library';
import { usePersistedView } from '../../src/dashboard/hooks/use-persisted-view';
import { useSetPrivacy } from '../../src/dashboard/hooks/use-set-privacy';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import { useUploadFromLibrary } from '../../src/dashboard/hooks/use-upload-from-library';
import { useVideoPressUpgrade } from '../../src/dashboard/hooks/use-videopress-upgrade';
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
// on via the DataViews field-visibility control.
const GRID_VISIBLE_FIELDS: string[] = [];
// `fileSize` is intentionally omitted: it's only populated for local
// (non-VideoPress) uploads today, so it's blank for most rows. Users
// who want the column can still toggle it on via the DataViews column-
// visibility control.
const TABLE_VISIBLE_FIELDS = [ 'filename', 'duration', 'uploadDate', 'privacy' ];

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

const StageInner = () => {
	const [ initialView, persistView ] = usePersistedView( DEFAULT_VIEW );
	const [ view, setView ] = useState< View >( initialView );
	const [ selection, setSelection ] = useState< string[] >( [] );
	const [ captionVideo, setCaptionVideo ] = useState< LibraryItem | null >( null );
	// Local IDs currently being promoted from local-storage to VideoPress.
	// The upload-from-library endpoint doesn't report progress, so we just
	// need to know which rows to overlay with an "Uploading…" state.
	const [ promotingIds, setPromotingIds ] = useState< Set< string > >( () => new Set() );
	// IDs currently being deleted. Same overlay technique as promotingIds:
	// rows get a "Deleting…" state (thumbnail overlay in grid, title pill in
	// table) until the post-delete refetch removes them from the listing.
	const [ deletingIds, setDeletingIds ] = useState< Set< string > >( () => new Set() );

	const { items, isLoading, paginationInfo, refetch } = useLibrary( view );
	const { uploadQueue, startUpload, retryUpload } = useUpload();
	const { mutateAsync: deleteVideo } = useDeleteVideo();
	const { mutateAsync: setPrivacyAsync } = useSetPrivacy();
	const { mutate: uploadFromLibrary } = useUploadFromLibrary();
	const { isAtLimit, isFree, isUnlimited, videoCount, limit } = useFreeTier();
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
	const onFilePicked = useCallback(
		( event: ChangeEvent< HTMLInputElement > ) => {
			const file = event.target.files?.[ 0 ];
			if ( file ) {
				startUpload( file );
			}
			event.target.value = '';
		},
		[ startUpload ]
	);

	const navigate = useNavigate();

	const openVideoDetails = useCallback(
		( id: string ) => {
			navigate( { href: `/video/${ id }` } );
		},
		[ navigate ]
	);

	const { createSuccessNotice, createErrorNotice, createInfoNotice } = useGlobalNotices();

	// Drag-and-drop entry point. Mirrors the file-picker's `startUpload`
	// path but accepts multiple files and enforces the free-tier cap up
	// front so a drop can't sneak past the limit the picker button guards.
	const handleFilesDrop = useCallback(
		( files: File[] ) => {
			const decision = planVideoDrop( files, {
				isFree,
				isUnlimited,
				limit,
				videoCount,
			} );

			if ( decision.kind === 'no-videos' ) {
				createErrorNotice( __( 'Only video files can be uploaded.', 'jetpack-videopress-pkg' ) );
				return;
			}

			if ( decision.kind === 'at-limit' ) {
				createErrorNotice(
					__(
						'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
						'jetpack-videopress-pkg'
					),
					{
						actions: [ { label: __( 'Upgrade', 'jetpack-videopress-pkg' ), onClick: runUpgrade } ],
					}
				);
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

	const promoteLocal = useCallback(
		( id: string ) => {
			setPromotingIds( prev => {
				const next = new Set( prev );
				next.add( id );
				return next;
			} );
			uploadFromLibrary( id, {
				onSuccess: () => {
					createSuccessNotice( __( 'Video uploaded to VideoPress.', 'jetpack-videopress-pkg' ) );
				},
				onError: ( error: Error ) => {
					const reason = error?.message?.trim();
					createErrorNotice(
						reason
							? sprintf(
									/* translators: %s: reason returned by the upload endpoint, e.g. "403: Invalid Mime". */
									__( 'Failed to upload video to VideoPress: %s', 'jetpack-videopress-pkg' ),
									reason
							  )
							: __( 'Failed to upload video to VideoPress.', 'jetpack-videopress-pkg' )
					);
				},
				onSettled: () => {
					setPromotingIds( prev => {
						if ( ! prev.has( id ) ) {
							return prev;
						}
						const next = new Set( prev );
						next.delete( id );
						return next;
					} );
				},
			} );
		},
		[ uploadFromLibrary, createSuccessNotice, createErrorNotice ]
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
				uploadDate: new Date().toISOString(),
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
				tracks: [],
			} ) );
		// Overlay an in-flight state on items currently being promoted from
		// local-storage to VideoPress or being deleted, so the title-cell
		// pill and the thumbnail overlay reflect the operation without
		// needing a parallel signal at every render site.
		const overlaid = items.map( item => {
			if ( promotingIds.has( item.id ) ) {
				return { ...item, upload: { status: 'promoting' as const, progress: 0 } };
			}
			if ( deletingIds.has( item.id ) ) {
				return { ...item, upload: { status: 'deleting' as const, progress: 0 } };
			}
			return item;
		} );
		return [ ...inFlight, ...overlaid ];
	}, [ uploadQueue, items, promotingIds, deletingIds ] );

	const getItemId = useCallback( ( item: LibraryItem ) => item.id, [] );

	const onCaptionTracksChange = useCallback( () => {
		void refetch();
	}, [ refetch ] );

	return (
		<DashboardLayout
			activeTab="library"
			hideFooter
			actions={
				<>
					<input
						ref={ filePickerRef }
						type="file"
						accept="video/*"
						style={ { display: 'none' } }
						onChange={ onFilePicked }
					/>
					<Tooltip
						text={
							isAtLimit
								? __(
										'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.',
										'jetpack-videopress-pkg'
								  )
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
			}
		>
			<UploadActionsProvider value={ { promoteLocal, retryUpload, openVideoDetails } }>
				<div className={ `vp-library__viewport vp-library__viewport--${ view.type }` }>
					<DropZone
						label={ __( 'Drop a video to upload', 'jetpack-videopress-pkg' ) }
						onFilesDrop={ handleFilesDrop }
					/>
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
