import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { DropZone, Tooltip } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/dashboard-layout';
import { buildLibraryActions } from '../../src/dashboard/components/library/actions';
import { libraryFields } from '../../src/dashboard/components/library/fields';
import { UploadActionsProvider } from '../../src/dashboard/components/library/upload-actions-context';
import QueryClientWrapper from '../../src/dashboard/components/query-client-wrapper';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useLibrary } from '../../src/dashboard/hooks/use-library';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import { useUploadFromLibrary } from '../../src/dashboard/hooks/use-upload-from-library';
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
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ selection, setSelection ] = useState< string[] >( [] );
	// Local IDs currently being promoted from local-storage to VideoPress.
	// The upload-from-library endpoint doesn't report progress, so we just
	// need to know which rows to overlay with an "Uploading…" state.
	const [ promotingIds, setPromotingIds ] = useState< Set< string > >( () => new Set() );

	const { items, isLoading, paginationInfo } = useLibrary( view );
	const { uploadQueue, startUpload, retryUpload } = useUpload();
	const { mutate: deleteVideo } = useDeleteVideo();
	const { mutate: updateMeta } = useUpdateVideoMeta();
	const { mutate: uploadFromLibrary } = useUploadFromLibrary();
	const { isAtLimit, isFree, isUnlimited, videoCount, limit } = useFreeTier();

	const onChangeView = useCallback( ( next: View ) => {
		setView( current => {
			if ( next.type === current.type ) {
				return next;
			}
			return {
				...next,
				fields: next.type === 'table' ? TABLE_VISIBLE_FIELDS : GRID_VISIBLE_FIELDS,
			};
		} );
	}, [] );

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

	const { createSuccessNotice, createErrorNotice } = useGlobalNotices();

	// Drag-and-drop entry point. Mirrors the file-picker's `startUpload`
	// path but accepts multiple files and enforces the free-tier cap up
	// front so a drop can't sneak past the limit the picker button guards.
	const handleFilesDrop = useCallback(
		( files: File[] ) => {
			const decision = planVideoDrop( files, {
				isAtLimit,
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
					)
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
		[ isAtLimit, isFree, isUnlimited, limit, videoCount, startUpload, createErrorNotice ]
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
				deleteItems: ( ids: string[] ) => {
					deleteVideo( ids, {
						onSuccess: () => {
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
								)
							);
						},
						onError: () => {
							createErrorNotice(
								_n(
									'Failed to delete video.',
									'Failed to delete videos.',
									ids.length,
									'jetpack-videopress-pkg'
								)
							);
						},
					} );
				},
				setPrivacy: ( id: string, privacy: LibraryItemPrivacy ) => {
					updateMeta(
						{ id, patch: { privacy } },
						{
							onSuccess: () => {
								createSuccessNotice(
									sprintf(
										/* translators: %s: new privacy label. */
										__( 'Privacy updated to %s.', 'jetpack-videopress-pkg' ),
										PRIVACY_LABELS[ privacy ]
									)
								);
							},
							onError: () => {
								createErrorNotice( __( 'Failed to update privacy.', 'jetpack-videopress-pkg' ) );
							},
						}
					);
				},
			} ),
		[
			promoteLocal,
			retryUpload,
			deleteVideo,
			updateMeta,
			openVideoDetails,
			createSuccessNotice,
			createErrorNotice,
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
			} ) );
		// Overlay an "uploading"-style state on items currently being
		// promoted from local-storage to VideoPress, so the title-cell
		// pill and the thumbnail overlay reflect the in-flight state
		// without needing a parallel signal at every render site.
		const overlaid = promotingIds.size
			? items.map( item =>
					promotingIds.has( item.id )
						? { ...item, upload: { status: 'promoting' as const, progress: 0 } }
						: item
			  )
			: items;
		return [ ...inFlight, ...overlaid ];
	}, [ uploadQueue, items, promotingIds ] );

	const getItemId = useCallback( ( item: LibraryItem ) => item.id, [] );

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
			<UploadActionsProvider value={ { promoteLocal, retryUpload } }>
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
		</DashboardLayout>
	);
};

const Stage = () => (
	<QueryClientWrapper>
		<StageInner />
	</QueryClientWrapper>
);

export { Stage as stage };
