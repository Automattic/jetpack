import { GlobalNotices, useGlobalNotices } from '@automattic/jetpack-components/global-notices';
import { DataViews } from '@wordpress/dataviews';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import DashboardLayout from '../../src/dashboard/components/DashboardLayout';
import { buildLibraryActions } from '../../src/dashboard/components/Library/actions';
import { libraryFields } from '../../src/dashboard/components/Library/fields';
import { UploadActionsProvider } from '../../src/dashboard/components/Library/upload-actions-context';
import { useMockLibrary } from '../../src/dashboard/hooks/use-mock-library';
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

const Stage = () => {
	const { items, isLoading, startUpload, promoteLocal, retryUpload, deleteItems, setPrivacy } =
		useMockLibrary();

	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ selection, setSelection ] = useState< string[] >( [] );

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
		filePickerRef.current?.click();
	}, [] );
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

	const openVideoDetails = useCallback( () => {
		// Phase 4 will route to the details screen.
	}, [] );

	const { createSuccessNotice } = useGlobalNotices();

	const actions = useMemo(
		() =>
			buildLibraryActions( {
				promoteLocal,
				retryUpload,
				openVideoDetails,
				deleteItems: ids => {
					deleteItems( ids );
					createSuccessNotice(
						sprintf(
							/* translators: %d: number of deleted videos. */
							_n( '%d video deleted.', '%d videos deleted.', ids.length, 'jetpack-videopress-pkg' ),
							ids.length
						)
					);
				},
				setPrivacy: ( id, privacy ) => {
					setPrivacy( id, privacy );
					createSuccessNotice(
						sprintf(
							/* translators: %s: new privacy label, e.g. "Public". */
							__( 'Privacy updated to %s.', 'jetpack-videopress-pkg' ),
							PRIVACY_LABELS[ privacy ]
						)
					);
				},
			} ),
		[ promoteLocal, retryUpload, deleteItems, setPrivacy, openVideoDetails, createSuccessNotice ]
	);

	const filteredData = useMemo< MockLibraryItem[] >( () => {
		let result = items;

		const search = view.search?.trim().toLowerCase();
		if ( search ) {
			result = result.filter(
				item =>
					item.title.toLowerCase().includes( search ) ||
					item.filename.toLowerCase().includes( search )
			);
		}

		for ( const filter of view.filters ?? [] ) {
			const { field, value } = filter;
			if ( value === undefined || value === null || value === 'all' ) {
				continue;
			}
			result = result.filter( item => {
				switch ( field ) {
					case 'type':
						return item.type === value;
					case 'privacy':
						return item.privacy === value;
					default:
						return true;
				}
			} );
		}

		if ( view.sort ) {
			const { field, direction } = view.sort;
			const dir = direction === 'asc' ? 1 : -1;
			result = [ ...result ].sort( ( a, b ) => {
				switch ( field ) {
					case 'title':
						return a.title.localeCompare( b.title ) * dir;
					case 'uploadDate':
						return ( a.uploadDate < b.uploadDate ? -1 : 1 ) * dir;
					case 'duration':
						return ( a.durationSeconds - b.durationSeconds ) * dir;
					case 'fileSize':
						return ( a.fileSizeBytes - b.fileSizeBytes ) * dir;
					default:
						return 0;
				}
			} );
		}

		return result;
	}, [ items, view.search, view.filters, view.sort ] );

	const perPage = view.perPage ?? 12;
	const totalItems = filteredData.length;
	const totalPages = Math.max( 1, Math.ceil( totalItems / perPage ) );
	const page = Math.min( view.page ?? 1, totalPages );
	const pagedData = useMemo(
		() => filteredData.slice( ( page - 1 ) * perPage, page * perPage ),
		[ filteredData, page, perPage ]
	);

	const paginationInfo = useMemo(
		() => ( { totalItems, totalPages } ),
		[ totalItems, totalPages ]
	);

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
					<Button size="compact" onClick={ onClickHeaderUpload }>
						{ __( 'Upload video', 'jetpack-videopress-pkg' ) }
					</Button>
				</>
			}
		>
			<UploadActionsProvider value={ { promoteLocal, retryUpload } }>
				<div className={ `vp-library__viewport vp-library__viewport--${ view.type }` }>
					<DataViews< MockLibraryItem >
						data={ pagedData }
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
			<GlobalNotices />
		</DashboardLayout>
	);
};

export { Stage as stage };
