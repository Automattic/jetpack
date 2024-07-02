/**
 * External dependencies
 */
import { debounce } from '@wordpress/compose';
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
/**
 * Internal dependencies
 */
import Highlight from './Highlight';
import { getClientId } from './utils/getClientId';
import { getHighlightRects } from './utils/getHighlightRects';
import { requestAnimationFrame } from './utils/requestAnimationFrame';
import { saveCaretPosition, restoreCaretPosition } from './utils/textEditingHelpers';

const Highlights = ( {
	isHighlighting = true,
	containerEl,
	isAIOn,
	AIAPIKey,
	toggledKeys,
	isIframed,
	content,
} ) => {
	const [ highlights, setHighlights ] = useState( [] );
	const caretPositionRef = useRef( null );

	const updatePosition = useCallback( () => {
		if ( ! isHighlighting ) {
			return;
		}

		const all = [];

		const blocks = containerEl?.querySelectorAll( '.block-editor-rich-text__editable' );

		if ( ! blocks ) {
			return;
		}

		for ( const block of blocks ) {
			const clientId = getClientId( block );
			const rects = getHighlightRects( block );

			rects.forEach( ( { rect, rangeIndex, range, replacementText, replacement, type } ) => {
				if ( toggledKeys[ type ] ) {
					all.push( {
						type,
						rect,
						rangeIndex,
						replacementText,
						replacement,
						range,
						clientId,
						block,
					} );
				}
			} );
		}

		setHighlights( [ ...all ] );
	}, [ containerEl, isHighlighting, toggledKeys ] );

	const debouncedUpdatePosition = useMemo(
		() => debounce( updatePosition, 300 ),
		[ updatePosition ]
	);

	const handleInput = useCallback( () => {
		saveCaretPosition( containerEl, caretPositionRef );
		updatePosition();
		restoreCaretPosition( containerEl, caretPositionRef );
	}, [ updatePosition, containerEl, caretPositionRef ] );

	useEffect( () => {
		if ( ! isHighlighting ) {
			return;
		}

		updatePosition();

		const handleClick = () => requestAnimationFrame( updatePosition );

		window.addEventListener( 'resize', debouncedUpdatePosition );

		containerEl.ownerDocument.addEventListener( 'mousedown', handleClick );
		containerEl.addEventListener( 'input', handleInput );

		return () => {
			window.removeEventListener( 'resize', debouncedUpdatePosition );

			containerEl.ownerDocument.removeEventListener( 'mousedown', handleClick );
			containerEl.removeEventListener( 'input', handleInput );

			debouncedUpdatePosition.cancel();
		};
	}, [
		AIAPIKey,
		containerEl,
		isAIOn,
		isHighlighting,
		toggledKeys,
		updatePosition,
		debouncedUpdatePosition,
		handleInput,
		content,
	] );

	const replaceComplete = () => {
		requestAnimationFrame( updatePosition );
	};

	return (
		<div id="breve-highlights">
			{ isHighlighting &&
				highlights.map( ( highlight, index ) => (
					<Highlight
						key={ index }
						{ ...highlight }
						containerEl={ containerEl }
						isAIOn={ isAIOn }
						AIAPIKey={ AIAPIKey }
						replaceCompleteCB={ replaceComplete }
						isIframed={ isIframed }
					/>
				) ) }
		</div>
	);
};

export default Highlights;
