import { DataViewsPicker } from '@wordpress/dataviews';
import { useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Dialog } from '@wordpress/ui';
import { useLibrary } from '../../hooks/use-library';
import { usePosterUrl } from '../../hooks/use-poster-url';
import { formatDuration } from '../../utils/format';
import type { LibraryItem } from '../../types/library';
import type { ActionButton, Field, View } from '@wordpress/dataviews';

const VideoThumbnail = ( { item }: { item: LibraryItem } ) => {
	const posterUrl = usePosterUrl( item );

	return (
		<div className="vp-playlist-picker__thumbnail">
			{ posterUrl ? <img src={ posterUrl } alt="" /> : null }
		</div>
	);
};

const fields: Field< LibraryItem >[] = [
	{
		id: 'thumbnail',
		label: __( 'Thumbnail', 'jetpack-videopress-pkg' ),
		type: 'media',
		render: VideoThumbnail,
		enableSorting: false,
		enableHiding: false,
	},
	{
		id: 'title',
		label: __( 'Title', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.title,
		enableHiding: false,
	},
	{
		id: 'duration',
		label: __( 'Duration', 'jetpack-videopress-pkg' ),
		getValue: ( { item } ) => item.durationSeconds,
		render: ( { item } ) => formatDuration( item.durationSeconds ),
		enableSorting: false,
	},
	{
		id: 'uploadDate',
		label: __( 'Uploaded', 'jetpack-videopress-pkg' ),
		type: 'datetime',
		getValue: ( { item } ) => item.uploadDate,
	},
];

const DEFAULT_VIEW: View = {
	type: 'pickerGrid',
	page: 1,
	perPage: 20,
	titleField: 'title',
	mediaField: 'thumbnail',
	fields: [ 'duration' ],
	sort: { field: 'uploadDate', direction: 'desc' },
	filters: [],
	search: '',
};

// Only VideoPress videos have the GUID a playlist entry needs.
const VIDEOPRESS_ONLY = [ { field: 'type', operator: 'is' as const, value: 'videopress' } ];

type Props = {
	onAdd: ( items: LibraryItem[] ) => void;
	onClose: () => void;
};

/**
 * Pick videos from the library to append to a playlist.
 *
 * @param props         - Component props.
 * @param props.onAdd   - Receives the picked videos, in the order they were selected.
 * @param props.onClose - Closes the dialog.
 * @return The dialog element.
 */
export default function AddVideosDialog( { onAdd, onClose }: Props ) {
	const [ view, setView ] = useState< View >( DEFAULT_VIEW );
	const [ selection, setSelection ] = useState< string[] >( [] );
	// Selected rows from every page visited; the picker only hands back the current page's.
	const seen = useRef( new Map< string, LibraryItem >() );

	const { items, isLoading, paginationInfo } = useLibrary(
		{ ...view, filters: VIDEOPRESS_ONLY },
		{ poll: false }
	);
	const pickable = useMemo( () => items.filter( item => item.guid ), [ items ] );
	pickable.forEach( item => seen.current.set( item.id, item ) );

	// Separate statements so minification can't merge the two strings' calls.
	const addLabel = __( 'Add videos', 'jetpack-videopress-pkg' );
	const addCountLabel = sprintf(
		/* translators: %d: number of videos selected. */
		_n( 'Add %d video', 'Add %d videos', selection.length, 'jetpack-videopress-pkg' ),
		selection.length
	);

	const actions = useMemo< ActionButton< LibraryItem >[] >(
		() => [
			{
				id: 'add-to-playlist',
				label: selection.length ? addCountLabel : addLabel,
				isPrimary: true,
				supportsBulk: true,
				callback: () => {
					onAdd(
						selection
							.map( id => seen.current.get( id ) )
							.filter( ( item ): item is LibraryItem => Boolean( item ) )
					);
				},
			},
		],
		[ selection, onAdd, addLabel, addCountLabel ]
	);

	return (
		<Dialog.Root
			open
			onOpenChange={ open => {
				if ( ! open ) {
					onClose();
				}
			} }
		>
			<Dialog.Popup size="large" className="vp-playlist-picker">
				<Dialog.Header>
					<Dialog.Title>{ __( 'Add videos', 'jetpack-videopress-pkg' ) }</Dialog.Title>
					<Dialog.CloseIconButton label={ __( 'Close', 'jetpack-videopress-pkg' ) } />
				</Dialog.Header>
				<Dialog.Content>
					<DataViewsPicker< LibraryItem >
						data={ pickable }
						fields={ fields }
						view={ view }
						onChangeView={ setView }
						actions={ actions }
						selection={ selection }
						onChangeSelection={ setSelection }
						paginationInfo={ paginationInfo }
						isLoading={ isLoading }
						defaultLayouts={ { pickerGrid: true, pickerTable: true } }
						searchLabel={ __( 'Search videos', 'jetpack-videopress-pkg' ) }
						itemListLabel={ __( 'Videos', 'jetpack-videopress-pkg' ) }
						config={ { perPageSizes: [ 20, 40, 80 ] } }
						empty={ __( 'No VideoPress videos found.', 'jetpack-videopress-pkg' ) }
					/>
				</Dialog.Content>
			</Dialog.Popup>
		</Dialog.Root>
	);
}
