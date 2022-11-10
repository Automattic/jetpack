/**
 * External dependencies
 */
import { useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
/**
 * Internal dependencies
 */
import { allowedVideoExtensions } from '../../../utils/video-extensions';

const useSelectVideoFiles = ( {
	canDrop = false,
	dropElement,
	onSelectFiles,
}: {
	canDrop?: boolean;
	dropElement?: HTMLElement | Document;
	onSelectFiles?: ( files: File[] ) => void;
} = {} ) => {
	const [ isDraggingOver, setIsDraggingOver ] = useState( false );
	const inputRef = useRef( null );
	// Chrome and Firefox diverge on the order of events, with Chrome firing two leave events in a row, hence the array
	let dragTimeouts = [];

	const filterVideoFiles = ( files: FileList | File[] ) => {
		return Array.from( files ).filter( file => {
			return allowedVideoExtensions.some( extension => file.name.endsWith( extension ) );
		} );
	};

	const handleFileInputChangeEvent = useCallback(
		( event: Pick< ChangeEvent< HTMLInputElement >, 'currentTarget' > ) => {
			const files = filterVideoFiles( event.currentTarget.files );

			onSelectFiles( files );
		},
		[ onSelectFiles ]
	);

	const handleDragOverEvent = (
		event: Pick< DragEvent< HTMLElement >, 'stopPropagation' | 'preventDefault' >
	) => {
		event.preventDefault();
		event.stopPropagation();

		if ( dragTimeouts.length > 0 ) {
			dragTimeouts.forEach( timeout => clearTimeout( timeout ) );
			dragTimeouts = [];
		}

		setIsDraggingOver( true );
	};

	const handleDragLeaveEvent = () => {
		// Timeout to avoid flickering as the cursor changes which element it is hovering
		const timeout = setTimeout( () => {
			setIsDraggingOver( false );

			const timeoutIndex = dragTimeouts.findIndex( dragTimeout => dragTimeout === timeout );
			if ( timeoutIndex > -1 ) {
				dragTimeouts.splice( timeoutIndex, 1 );
			}
		}, 100 );

		dragTimeouts.push( timeout );
	};

	const handleDropEvent = useCallback(
		(
			event: Pick< DragEvent< HTMLElement >, 'preventDefault' | 'stopPropagation' | 'dataTransfer' >
		) => {
			setIsDraggingOver( false );

			event.preventDefault();
			event.stopPropagation();

			dragTimeouts.forEach( timeout => clearTimeout( timeout ) );
			dragTimeouts = [];

			if ( ! canDrop ) {
				return;
			}

			const files = filterVideoFiles( event.dataTransfer.files );

			onSelectFiles( files );
		},
		[ canDrop, onSelectFiles ]
	);

	useEffect( () => {
		if ( ! canDrop ) {
			setIsDraggingOver( false );
		}
	}, [ canDrop ] );

	if ( dropElement ) {
		useEffect( () => {
			dropElement.addEventListener( 'drop', ( handleDropEvent as unknown ) as EventListener );
			dropElement.addEventListener( 'dragover', handleDragOverEvent );
			dropElement.addEventListener( 'dragleave', handleDragLeaveEvent );

			return () => {
				dropElement.removeEventListener( 'drop', ( handleDropEvent as unknown ) as EventListener );
				dropElement.removeEventListener( 'dragover', handleDragOverEvent );
				dropElement.removeEventListener( 'dragleave', handleDragLeaveEvent );
			};
		}, [ handleDropEvent, handleDragOverEvent, handleDragLeaveEvent ] );
	}

	return {
		isDraggingOver,
		inputRef,
		setIsDraggingOver,
		handleFileInputChangeEvent,
		handleDragOverEvent,
		handleDragLeaveEvent,
		handleDropEvent,
		filterVideoFiles,
	};
};

export default useSelectVideoFiles;
