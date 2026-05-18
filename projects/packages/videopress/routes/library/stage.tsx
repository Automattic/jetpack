import { useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { Tooltip } from '@wordpress/components';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/DashboardLayout';
import { buildLibraryActions } from '../../src/dashboard/components/Library/actions';
import { libraryFields } from '../../src/dashboard/components/Library/fields';
import { UploadActionsProvider } from '../../src/dashboard/components/Library/upload-actions-context';
import QueryClientWrapper from '../../src/dashboard/components/QueryClientWrapper';
import { useDeleteVideo } from '../../src/dashboard/hooks/use-delete-video';
import { useFreeTier } from '../../src/dashboard/hooks/use-free-tier';
import { useLibrary } from '../../src/dashboard/hooks/use-library';
import { useUpdateVideoMeta } from '../../src/dashboard/hooks/use-update-video-meta';
import { useUpload } from '../../src/dashboard/hooks/use-upload';
import './style.scss';
import type { LibraryItemPrivacy, MockLibraryItem } from '../../src/dashboard/types/library';
import type { View } from '@wordpress/dataviews';
import type { ChangeEvent } from 'react';

const PRIVACY_LABELS: Record< LibraryItemPrivacy, string > = {
	public: __( 'Public', 'jetpack-videopress-pkg' ),
	private: __( 'Private', 'jetpack-videopress-pkg' ),
	'site-default': __( 'Site default', 'jetpack-videopress-pkg' ),
};

const GRID_VISIBLE_FIELDS = [ 'filename' ];
const TABLE_VISIBLE_FIELDS = [ 'filename', 'duration', 'fileSize', 'uploadDate', 'privacy' ];

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

const defaultLayouts = {
	grid: { previewSize: 220, density: 'comfortable' as const },
	table: { density: 'balanced' as const },
};

const StageInner = () => {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ selection, setSelection ] = useState< string[] >( [] );

	const { items, isLoading, paginationInfo } = useLibrary( view );
	const { uploadQueue, startUpload, retryUpload } = useUpload();
	const { mutate: deleteVideo } = useDeleteVideo();
	const { mutate: updateMeta } = useUpdateVideoMeta();
	const { isAtLimit } = useFreeTier();

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

	const actions = useMemo(
		() =>
			buildLibraryActions( {
				promoteLocal: () => {
					// no-op: the real uploader doesn't have a separate "promote local" step
				},
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
	const renderedItems = useMemo< MockLibraryItem[] >( () => {
		const inFlight: MockLibraryItem[] = uploadQueue
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
				rating: 'G' as MockLibraryItem[ 'rating' ],
				displayEmbed: false,
				allowDownloads: false,
				shortcode: '',
				isProcessing: false,
			} ) );
		return [ ...inFlight, ...items ];
	}, [ uploadQueue, items ] );

	const getItemId = useCallback( ( item: MockLibraryItem ) => item.id, [] );

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
			<UploadActionsProvider value={ { promoteLocal: () => {}, retryUpload } }>
				<div className={ `vp-library__viewport vp-library__viewport--${ view.type }` }>
					<DataViews< MockLibraryItem >
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
