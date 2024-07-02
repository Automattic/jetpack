/**
 * External dependencies
 */
import { Popover, Button } from '@wordpress/components';
import React, { useState, useLayoutEffect, useEffect, useCallback, useRef } from 'react';
/**
 * Internal dependencies
 */
import config from './dictionaries/dictionaries-config';
import { handleMessage } from './utils/handleMessage';
import { requestAnimationFrame } from './utils/requestAnimationFrame';
import { sendAIRequest } from './utils/sendAIRequest';
import { simulateClick } from './utils/textEditingHelpers';

const calcPosition = ( rect, containerRect ) => {
	if ( ! rect || ! containerRect ) {
		return;
	}

	const left = rect.left - containerRect.left;
	const top = rect.top - containerRect.top;

	return {
		transform: `translate(${ left }px, ${ top }px)`,
		width: `${ rect.width }px`,
		height: `${ rect.height }px`,
		position: 'absolute',
	};
};

const Highlight = ( {
	type,
	rect,
	rangeIndex,
	replacementText,
	replacement,
	range,
	clientId,
	block,
	containerEl,
	isAIOn,
	AIAPIKey,
	replaceCompleteCB,
} ) => {
	const highlightContainerRef = useRef( null );
	const [ isVisible, setIsVisible ] = useState( false );
	const [ posStyles, setPosStyles ] = useState( {} );
	const [ isProcessing, setIsProcessing ] = useState( false );
	const [ isEditingText, setIsEditingText ] = useState( false );
	const [ isHovering, setIsHovering ] = useState( false );

	const updatePosition = useCallback( () => {
		if ( ! highlightContainerRef.current || ! containerEl ) {
			return;
		}

		requestAnimationFrame( () => {
			const updatedRect = range.getClientRects()[ rangeIndex ];
			const parentRect = highlightContainerRef.current.parentNode.getBoundingClientRect();
			const pos = calcPosition( updatedRect, parentRect );
			setPosStyles( pos );
		} );
	}, [ highlightContainerRef, containerEl, range, rangeIndex ] );

	useLayoutEffect( () => {
		updatePosition();
	}, [ highlightContainerRef, rect, containerEl, updatePosition ] );

	const rangeStart = range.startOffset;
	const rangeEnd = range.endOffset;
	const rangeParent = range.startContainer.parentNode;

	let parentSentence = '';
	let blockText = '';

	blockText = rangeParent.textContent || rangeParent.innerText;
	const preText = blockText.substring( 0, rangeStart );
	const postText = blockText.substring( rangeEnd );
	const startIndex = preText.lastIndexOf( '.' ) + 1;
	const endIndex =
		postText.indexOf( '.' ) === -1 ? blockText.length : rangeEnd + postText.indexOf( '.' ) + 1;
	parentSentence = blockText.substring( startIndex, endIndex ).trim();

	const dictConfig = config.dictionaries[ type ];

	let popoverContents = '';
	if ( dictConfig.type === 'key-value' ) {
		popoverContents = dictConfig.tooltip.replace( '{value}', replacement );
	} else {
		popoverContents = dictConfig.tooltip;
	}

	const fixWithAI = () => {
		if ( ! isAIOn ) {
			return;
		}

		setIsProcessing( true );

		sendAIRequest( replacementText, type, AIAPIKey, parentSentence, blockText ).then( val => {
			const payload = {
				type: 'replaceWord',
				clientId,
				aiReplacementText: val,
				updateFunc: () => {
					// Call parent to update layout of highlights
					replaceCompleteCB();

					setIsProcessing( false );
				},
			};

			handleMessage( payload );
		} );
	};

	const onDisabledHighlightMove = useCallback(
		e => {
			const x = e.clientX;
			const y = e.clientY;
			const buffer = 25;

			if (
				x < rect.left - buffer ||
				x > rect.right + buffer ||
				y < rect.top - buffer ||
				y > rect.bottom + buffer
			) {
				setIsEditingText( false );
			}
		},
		[ rect ]
	);

	useEffect( () => {
		if ( isEditingText ) {
			block.addEventListener( 'mousemove', onDisabledHighlightMove );

			return () => {
				block.removeEventListener( 'mousemove', onDisabledHighlightMove );
			};
		}
	}, [ block, isEditingText, onDisabledHighlightMove ] );

	const activateHoverUI = () => {
		if ( isProcessing ) {
			return;
		}

		setIsVisible( true );
	};

	const handleMouseDown = useCallback(
		event => {
			setIsEditingText( true );
			setIsVisible( false );

			// A virtual click down to edit the text
			// below the overlay that was clicked.
			simulateClick( event, block );
		},
		[ block ]
	);

	const handleMouseUp = () => {
		setIsEditingText( false );
	};

	// Ensure posStyles is not null before destructuring
	const { width, height, position, transform } = posStyles || {};

	return (
		<div
			ref={ highlightContainerRef }
			className="highlight-container"
			style={ {
				width,
				height,
				position,
				transform,
			} }
			onMouseOver={ activateHoverUI }
			onFocus={ activateHoverUI }
			onMouseLeave={ () => setIsVisible( false ) }
			onMouseDown={ handleMouseDown }
			onMouseUp={ handleMouseUp }
			role="menu"
			tabIndex={ 0 }
		>
			<div
				className={ `highlight-overlay ${ type } ${ isProcessing ? 'isProcessing' : '' } ${
					isEditingText ? 'isEditingText' : ''
				} ` }
			></div>
			{ ( isVisible || isHovering ) && (
				<Popover
					anchor={ highlightContainerRef.current }
					placement="bottom"
					offset={ -3 }
					className="highlight-popover"
					variant="tooltip"
					animate={ false }
					focusOnMount={ false }
					onMouseEnter={ () => {
						setIsVisible( false );
						setIsHovering( true );
					} }
					onMouseLeave={ () => {
						setIsVisible( false );
						setIsHovering( false );
					} }
				>
					<div>{ popoverContents }</div>
					{ isAIOn && (
						<Button
							size="small"
							variant="primary"
							onMouseDown={ e => {
								e.stopPropagation();
								fixWithAI();
								setIsVisible( false );
								setIsHovering( false );

								return false;
							} }
						>
							Fix with AI
						</Button>
					) }
				</Popover>
			) }
		</div>
	);
};

export default Highlight;
