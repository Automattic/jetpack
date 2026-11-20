import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { chevronDown, chevronUp, closeSmall, dragHandle, Icon } from '@wordpress/icons';
import { IconButton, Text } from '@wordpress/ui';
import { moveEntry, resolutionLabel } from '../../../client/block-editor/blocks/playlist/utils';
import { useVideoLiveMetadata } from '../../hooks/use-video-live-metadata';
import { formatDuration } from '../../utils/format';
import type { PlaylistEntry } from '../../types/playlists';

type RowProps = {
	entry: PlaylistEntry;
	index: number;
	count: number;
	onMove: ( from: number, to: number ) => void;
	onRemove: ( index: number ) => void;
};

/**
 * One playlist entry: drag handle, poster, title, meta line, move and remove buttons.
 *
 * @param props          - Component props.
 * @param props.entry    - The entry.
 * @param props.index    - Its position.
 * @param props.count    - Number of entries.
 * @param props.onMove   - Moves an entry.
 * @param props.onRemove - Removes an entry.
 * @return The row contents.
 */
const RowContents = ( { entry, index, count, onMove, onRemove }: RowProps ) => {
	const { title, poster } = useVideoLiveMetadata( entry.guid );
	const label = title || entry.guid;
	const meta = [
		resolutionLabel( entry.height ),
		entry.durationMs ? formatDuration( entry.durationMs / 1000 ) : '',
	]
		.filter( Boolean )
		.join( ' · ' );

	return (
		<>
			{ /* Pointer-only; the move buttons cover keyboard users. */ }
			<span className="vp-playlist-videos__handle" aria-hidden="true">
				<Icon icon={ dragHandle } size={ 20 } />
			</span>
			<span className="vp-playlist-videos__position">{ index + 1 }</span>
			<span className="vp-playlist-videos__thumb">
				{ poster ? <img src={ poster } alt="" loading="lazy" /> : null }
			</span>
			<span className="vp-playlist-videos__body">
				<Text className="vp-playlist-videos__title" title={ label }>
					{ label }
				</Text>
				{ meta && (
					<Text variant="body-sm" className="vp-playlist-videos__meta">
						{ meta }
					</Text>
				) }
			</span>
			<span className="vp-playlist-videos__actions">
				<IconButton
					icon={ chevronUp }
					variant="minimal"
					size="compact"
					label={ sprintf(
						/* translators: %s: title (or GUID) of the video. */
						__( 'Move “%s” up', 'jetpack-videopress-pkg' ),
						label
					) }
					disabled={ index === 0 }
					onClick={ () => onMove( index, index - 1 ) }
				/>
				<IconButton
					icon={ chevronDown }
					variant="minimal"
					size="compact"
					label={ sprintf(
						/* translators: %s: title (or GUID) of the video. */
						__( 'Move “%s” down', 'jetpack-videopress-pkg' ),
						label
					) }
					disabled={ index === count - 1 }
					onClick={ () => onMove( index, index + 1 ) }
				/>
				<IconButton
					icon={ closeSmall }
					variant="minimal"
					size="compact"
					label={ sprintf(
						/* translators: %s: title (or GUID) of the video. */
						__( 'Remove “%s” from the playlist', 'jetpack-videopress-pkg' ),
						label
					) }
					onClick={ () => onRemove( index ) }
				/>
			</span>
		</>
	);
};

type Props = {
	videos: PlaylistEntry[];
	onChange: ( videos: PlaylistEntry[] ) => void;
};

/**
 * The ordered videos of a playlist, reorderable by drag and drop or the move buttons.
 *
 * @param props          - Component props.
 * @param props.videos   - The entries.
 * @param props.onChange - Receives the new entry list.
 * @return The list element.
 */
export default function PlaylistVideos( { videos, onChange }: Props ) {
	const [ dragIndex, setDragIndex ] = useState< number | null >( null );
	const [ dropIndex, setDropIndex ] = useState< number | null >( null );

	const move = ( from: number, to: number ) => {
		const next = moveEntry( videos, from, to );
		if ( next !== videos ) {
			onChange( next );
		}
	};
	const remove = ( index: number ) => onChange( videos.filter( ( _, i ) => i !== index ) );
	const endDrag = () => {
		setDragIndex( null );
		setDropIndex( null );
	};

	return (
		<ol
			className="vp-playlist-videos"
			aria-label={ __( 'Playlist videos', 'jetpack-videopress-pkg' ) }
		>
			{ videos.map( ( entry, index ) => {
				const classes = [ 'vp-playlist-videos__row' ];
				if ( dragIndex === index ) {
					classes.push( 'is-dragging' );
				}
				if ( dropIndex === index && dragIndex !== null && dragIndex !== index ) {
					classes.push( dragIndex < index ? 'is-drop-after' : 'is-drop-before' );
				}

				return (
					<li
						// Entries may repeat a GUID, so the position disambiguates.
						key={ `${ entry.guid }-${ index }` }
						className={ classes.join( ' ' ) }
						draggable
						onDragStart={ event => {
							setDragIndex( index );
							event.dataTransfer.effectAllowed = 'move';
							event.dataTransfer.setData( 'text/plain', String( index ) );
						} }
						onDragOver={ event => {
							event.preventDefault();
							event.dataTransfer.dropEffect = 'move';
							if ( dragIndex !== null && dropIndex !== index ) {
								setDropIndex( index );
							}
						} }
						onDrop={ event => {
							event.preventDefault();
							if ( dragIndex !== null ) {
								move( dragIndex, index );
							}
							endDrag();
						} }
						onDragEnd={ endDrag }
					>
						<RowContents
							entry={ entry }
							index={ index }
							count={ videos.length }
							onMove={ move }
							onRemove={ remove }
						/>
					</li>
				);
			} ) }
		</ol>
	);
}
