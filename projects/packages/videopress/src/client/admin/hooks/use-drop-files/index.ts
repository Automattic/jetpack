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

	const handleFileInputChangeEvent = useCallback(
		( e: ChangeEvent< HTMLInputElement > ) => {
			onSelectFiles( Array.from( e.currentTarget.files ) );
		},
		[ onSelectFiles ]
	);

	const handleDragOverEvent = ( event: DragEvent< HTMLElement > ) => {
		event.preventDefault();
		setIsDraggingOver( true );
	};

	const handleDragLeaveEvent = () => {
		setIsDraggingOver( false );
	};

	const handleDropEvent = useCallback(
		( event: DragEvent< HTMLElement > ) => {
			event.preventDefault();
			setIsDraggingOver( false );

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
