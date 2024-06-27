/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
/**
 * Internal dependencies
 */
import config from './dictionaries/dictionaries-config';
import { getHighlightRects } from './utils/getHighlightRects';
import { sendAIRequest } from './utils/sendAIRequest';

const createOverlay = (
	rect,
	range,
	replacementText,
	replacement,
	type,
	iframeDocument,
	container,
	clientId,
	isAIOn,
	AIAPIKey,
	isProcessing,
	setIsProcessing,
	highlightId
) => {
	const overlay = iframeDocument.createElement( 'div' );
	overlay.className = `highlight-overlay ${ type } ${ isAIOn && AIAPIKey ? 'aiOn' : '' } ${
		highlightId === isProcessing ? 'isProcessing' : ''
	}`;

	overlay.style.width = `${ rect.width }px`;
	overlay.style.height = `${ rect.height }px`;
	overlay.dataset.replacement = replacement;
	overlay.dataset.replacementOriginal = replacementText;
	overlay.dataset.clientId = clientId;

	const rangeStart = range.startOffset;
	const rangeEnd = range.endOffset;
	const rangeParent = range.startContainer.parentNode;

	overlay.dataset.rangeStart = rangeStart;
	overlay.dataset.rangeEnd = rangeEnd;
	overlay.dataset.rangeParent = rangeParent;

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

	if ( dictConfig.type === 'key-value' ) {
		overlay.dataset.tooltip = dictConfig.tooltip.replace( '{value}', replacement );
	} else {
		overlay.dataset.tooltip = dictConfig.tooltip;
	}

	container.appendChild( overlay );

	const overlayRect = overlay.getBoundingClientRect();
	const translateX = rect.left - overlayRect.left + container.scrollLeft;
	const translateY = rect.top - overlayRect.top + container.scrollTop;
	overlay.style.transform = `translate(${ translateX }px, ${ translateY }px)`;

	overlay.addEventListener( 'mousedown', e => {
		e.preventDefault();
		if ( ! isAIOn || ! AIAPIKey ) {
			return;
		}

		setIsProcessing( highlightId );

		sendAIRequest( replacementText, type, AIAPIKey, parentSentence, blockText ).then( val => {
			window.handleSpanClick( e, val );
			setIsProcessing( null );
		} );
	} );

	return overlay;
};

const useHighlight = (
	isHighlighting,
	isAIOn,
	AIAPIKey,
	toggledKeys,
	isProcessing,
	setIsProcessing,
	updateHandler
) => {
	useEffect( () => {
		const requestAnimationFrame = window.requestAnimationFrame || ( cb => cb() );

		const getClientId = element => {
			if ( ! element ) {
				return null;
			}

			const clientId = element.getAttribute( 'data-block' );

			if ( clientId ) {
				return clientId;
			}

			return getClientId( element.parentElement );
		};

		const updateOverlays = async () => {
			const iframe = document.querySelector( '.editor-canvas__iframe' );
			const iframeDocument = iframe?.contentDocument || iframe?.contentWindow.document;
			const container =
				iframeDocument?.body || document.querySelector( '.edit-post-visual-editor > div' );

			const existingOverlays =
				iframeDocument?.querySelectorAll( '.highlight-overlay' ) ||
				document.querySelectorAll( '.highlight-overlay' );
			existingOverlays.forEach( overlay => overlay.remove() );

			if ( ! isHighlighting ) {
				return;
			}

			const elements = iframeDocument
				? iframeDocument.querySelectorAll( '.block-editor-rich-text__editable' )
				: document.querySelectorAll(
						'.block-editor-writing-flow .block-editor-rich-text__editable'
				  );

			for ( const element of elements ) {
				const clientId = getClientId( element );
				const rects = await getHighlightRects( element, iframeDocument || document );
				rects.forEach( ( { rect, range, replacementText, replacement, type, highlightId } ) => {
					if ( toggledKeys[ type ] ) {
						createOverlay(
							rect,
							range,
							replacementText,
							replacement,
							type,
							iframeDocument || document,
							container,
							clientId,
							isAIOn,
							AIAPIKey,
							isProcessing,
							setIsProcessing,
							highlightId
						);
					}
				} );
			}
		};

		const observeElements = () => {
			const elements = document.querySelectorAll(
				'.block-editor-writing-flow .block-editor-rich-text__editable'
			);

			const observer = new window.IntersectionObserver( entries => {
				entries.forEach( entry => {
					if ( entry.isIntersecting && isHighlighting ) {
						requestAnimationFrame( updateOverlays );
					}
				} );
			} );

			elements.forEach( element => observer.observe( element ) );

			return observer;
		};

		const observer = observeElements();

		const handleKeyDown = () => {
			requestAnimationFrame( updateOverlays );
		};

		const handleClick = () => {
			requestAnimationFrame( updateOverlays );
		};

		const handleCanvasClick = () => {
			requestAnimationFrame( updateOverlays );
		};

		const canvas =
			document.querySelector( '.editor-canvas__iframe' )?.contentDocument?.body ||
			document.querySelector( '.edit-post-visual-editor > div' );

		if ( canvas ) {
			canvas.addEventListener( 'mousedown', handleCanvasClick );
			canvas.addEventListener( 'mouseup', handleCanvasClick );
		}

		const editor = document.querySelector( '.edit-post-visual-editor' );
		const resizeObserver = new window.ResizeObserver( () => {
			requestAnimationFrame( updateOverlays );
		} );

		if ( editor ) {
			resizeObserver.observe( editor );
		}

		document.addEventListener( 'keydown', handleKeyDown );
		document.addEventListener( 'mousedown', handleClick );
		document.addEventListener( 'mouseup', handleClick );
		window.addEventListener( 'resize', () => {
			requestAnimationFrame( updateOverlays );
		} );

		if ( ! window.handleSpanClick ) {
			window.handleSpanClick = function ( e, aiReplacementText ) {
				e.stopPropagation();
				e.preventDefault();
				const replacement = e.target.dataset.replacement;
				const clientId = e.target.dataset.clientId;

				if ( replacement && clientId ) {
					const payload = {
						type: 'replaceWord',
						clientId,
						aiReplacementText,
						updateFunc: () => {
							requestAnimationFrame( updateOverlays );
						},
					};

					updateHandler( payload );
				}
			};
		}

		requestAnimationFrame( updateOverlays );

		return () => {
			observer.disconnect();
			if ( canvas ) {
				canvas.removeEventListener( 'mousedown', handleCanvasClick );
				canvas.removeEventListener( 'mouseup', handleCanvasClick );
			}
			document.removeEventListener( 'keydown', handleKeyDown );
			document.removeEventListener( 'mousedown', handleClick );
			document.removeEventListener( 'mouseup', handleClick );
			window.removeEventListener( 'resize', () => {
				requestAnimationFrame( updateOverlays );
			} );

			if ( editor ) {
				resizeObserver.unobserve( editor );
			}
		};
	}, [
		isHighlighting,
		isAIOn,
		AIAPIKey,
		toggledKeys,
		isProcessing,
		setIsProcessing,
		updateHandler,
	] );
};

export default useHighlight;
