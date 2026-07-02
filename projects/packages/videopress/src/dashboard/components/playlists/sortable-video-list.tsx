import {
	DndContext,
	KeyboardSensor,
	PointerSensor,
	closestCenter,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	SortableContext,
	sortableKeyboardCoordinates,
	useSortable,
	verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, chevronDown, chevronUp, closeSmall, dragHandle } from '@wordpress/icons';
import { IconButton, Stack, Text } from '@wordpress/ui';
import { moveItem } from '../../hooks/use-playlist-videos';
import { formatDuration } from '../../utils/format';
import type { PlaylistVideo } from '../../hooks/use-playlist-videos';
import type { DragEndEvent } from '@dnd-kit/core';

type RowProps = {
	video: PlaylistVideo;
	/** 1-based position, doubling as the visible rank number. */
	position: number;
	total: number;
	onMoveUp: () => void;
	onMoveDown: () => void;
	onRemove: () => void;
};

const SortableVideoRow = ( {
	video,
	position,
	total,
	onMoveUp,
	onMoveDown,
	onRemove,
}: RowProps ) => {
	const {
		attributes,
		listeners,
		setNodeRef,
		setActivatorNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable( { id: video.id } );

	return (
		<li
			ref={ setNodeRef }
			className={ `vp-playlist__row${ isDragging ? ' is-dragging' : '' }` }
			style={ { transform: CSS.Transform.toString( transform ), transition } }
		>
			{ /* Plain <button> rather than IconButton: dnd-kit's activator
			     listeners/attributes must land on the real DOM node, and the
			     KeyboardSensor's arrow-key handling shouldn't fight a tooltip
			     wrapper. */ }
			<button
				type="button"
				ref={ setActivatorNodeRef }
				className="vp-playlist__row-drag-handle"
				{ ...attributes }
				{ ...listeners }
				aria-label={ sprintf(
					/* translators: %s: video title. */
					__( 'Drag to reorder %s', 'jetpack-videopress-pkg' ),
					video.title
				) }
			>
				<Icon icon={ dragHandle } size={ 24 } />
			</button>
			<Text className="vp-playlist__row-position">{ position }</Text>
			<div className="vp-playlist__row-thumbnail">
				{ video.thumbnailUrl ? (
					<img src={ video.thumbnailUrl } alt="" />
				) : (
					<span className="vp-playlist__row-thumbnail-placeholder" />
				) }
			</div>
			<Stack direction="column" gap="xs" className="vp-playlist__row-info">
				<Text className="vp-playlist__row-title">{ video.title }</Text>
				{ video.durationSeconds > 0 ? (
					<Text className="vp-playlist__row-duration">
						{ formatDuration( video.durationSeconds ) }
					</Text>
				) : null }
			</Stack>
			<Stack direction="row" gap="xs" align="center" className="vp-playlist__row-actions">
				<IconButton
					icon={ chevronUp }
					size="small"
					variant="minimal"
					tone="neutral"
					disabled={ position === 1 }
					onClick={ onMoveUp }
					label={ sprintf(
						/* translators: %s: video title. */
						__( 'Move %s up', 'jetpack-videopress-pkg' ),
						video.title
					) }
				/>
				<IconButton
					icon={ chevronDown }
					size="small"
					variant="minimal"
					tone="neutral"
					disabled={ position === total }
					onClick={ onMoveDown }
					label={ sprintf(
						/* translators: %s: video title. */
						__( 'Move %s down', 'jetpack-videopress-pkg' ),
						video.title
					) }
				/>
				<IconButton
					icon={ closeSmall }
					size="small"
					variant="minimal"
					tone="neutral"
					onClick={ onRemove }
					label={ sprintf(
						/* translators: %s: video title. */
						__( 'Remove %s from playlist', 'jetpack-videopress-pkg' ),
						video.title
					) }
				/>
			</Stack>
		</li>
	);
};

type Props = {
	/** The playlist members, already in display order. */
	videos: PlaylistVideo[];
	/** Called with the full reordered ID list after a drag or move button. */
	onReorder: ( orderedIds: number[] ) => void;
	/** Called when a row's "Remove from playlist" action is activated. */
	onRemove: ( video: PlaylistVideo ) => void;
};

/**
 * Vertical drag-and-drop list of a playlist's videos. Rows can be dragged by
 * their handle (pointer or keyboard via dnd-kit's KeyboardSensor) and also
 * moved with per-row "Move up"/"Move down" buttons — a plain, discoverable
 * fallback for keyboard and assistive-technology users. Reordering emits the
 * complete ordered ID list; persisting it is the caller's job.
 *
 * @param props           - Component props.
 * @param props.videos    - The playlist members, already in display order.
 * @param props.onReorder - Receives the full reordered attachment ID list.
 * @param props.onRemove  - Receives the video to remove from the playlist.
 * @return The sortable list element.
 */
export default function SortableVideoList( { videos, onReorder, onRemove }: Props ) {
	const sensors = useSensors(
		// A small activation distance keeps plain clicks on the handle from
		// starting an accidental micro-drag.
		useSensor( PointerSensor, { activationConstraint: { distance: 4 } } ),
		useSensor( KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates } )
	);

	const ids = videos.map( video => video.id );

	const move = ( from: number, to: number ) => {
		const next = moveItem( ids, from, to );
		// moveItem returns the input array for no-ops (boundary moves,
		// unknown ids); skip the pointless server write.
		if ( next !== ids ) {
			onReorder( next );
		}
	};

	const handleDragEnd = ( event: DragEndEvent ) => {
		const { active, over } = event;
		if ( ! over || active.id === over.id ) {
			return;
		}
		move( ids.indexOf( Number( active.id ) ), ids.indexOf( Number( over.id ) ) );
	};

	return (
		<DndContext
			sensors={ sensors }
			collisionDetection={ closestCenter }
			onDragEnd={ handleDragEnd }
		>
			<SortableContext items={ ids } strategy={ verticalListSortingStrategy }>
				<ul className="vp-playlist__video-list">
					{ videos.map( ( video, index ) => (
						<SortableVideoRow
							key={ video.id }
							video={ video }
							position={ index + 1 }
							total={ videos.length }
							onMoveUp={ () => move( index, index - 1 ) }
							onMoveDown={ () => move( index, index + 1 ) }
							onRemove={ () => onRemove( video ) }
						/>
					) ) }
				</ul>
			</SortableContext>
		</DndContext>
	);
}
