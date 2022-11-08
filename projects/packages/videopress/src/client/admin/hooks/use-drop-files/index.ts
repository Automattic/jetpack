/**
 * External dependencies
 */
import { useEffect, useState, useRef, useCallback, DragEvent, ChangeEvent } from 'react';
/**
 * Internal dependencies
 */
import { allowedVideoExtensions } from '../../../utils/video-extensions';

const useDropFiles = ( {
	canDrop = true,
	onSelectFiles,
}: { canDrop?: boolean; onSelectFiles?: ( files: File[] ) => void } = {} ) => {
	const [ isDraggingOver, setIsDraggingOver ] = useState( false );
	const inputRef = useRef( null );
	// Chrome and Firefox diverge on the order of events, with Chrome firing two leave events in a row, hence the array
	let dragTimeouts = [];

	const handleFileInputChangeEvent = useCallback(
		( e: Pick< ChangeEvent< HTMLInputElement >, 'currentTarget' > ) => {
			onSelectFiles( Array.from( e.currentTarget.files ) );
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

			const files = Array.from( event.dataTransfer.files ).filter( file => {
				return allowedVideoExtensions.some( extension => file.name.endsWith( extension ) );
			} );

			onSelectFiles( files );
		},
		[ canDrop, onSelectFiles ]
	);

	useEffect( () => {
		if ( ! canDrop ) {
			setIsDraggingOver( false );
		}
	}, [ canDrop ] );

	return {
		isDraggingOver,
		inputRef,
		setIsDraggingOver,
		handleFileInputChangeEvent,
		handleDragOverEvent,
		handleDragLeaveEvent,
		handleDropEvent,
	};
};

export default useDropFiles;
