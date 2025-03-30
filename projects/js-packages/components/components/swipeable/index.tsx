import clsx from 'clsx';
import React, { Children, useState, useLayoutEffect, useRef, useCallback, useEffect } from 'react';

import './style.scss';

interface PageStyle {
	transitionDuration: string;
	height?: number;
	transform?: string;
}

const OFFSET_THRESHOLD_PERCENTAGE = 0.35; // Percentage of width to travel before we trigger the slider to move to the desired slide.
const VELOCITY_THRESHOLD = 0.2; // Speed of drag above, before we trigger the slider to move to the desired slide.
const VERTICAL_THRESHOLD_ANGLE = 55;
const TRANSITION_DURATION = '300ms';

/**
 * Custom hook to observe and handle resize events on a DOM element.
 *
 * @return {[React.Dispatch<React.SetStateAction<HTMLElement | null>>, ResizeObserverEntry | null]} Tuple containing setter and entry
 */
function useResizeObserver(): [
	React.Dispatch< React.SetStateAction< HTMLElement | null > >,
	ResizeObserverEntry | null,
] {
	const [ observerEntry, setObserverEntry ] = useState< ResizeObserverEntry | null >( null );
	const [ node, setNode ] = useState< HTMLElement | null >( null );
	const observer = useRef< ResizeObserver | null >( null );

	const disconnect = useCallback( () => observer.current?.disconnect(), [] );

	const observe = useCallback( () => {
		observer.current = new ResizeObserver( ( [ entry ] ) => setObserverEntry( entry ) );
		if ( node ) {
			observer.current.observe( node );
		}
	}, [ node ] );

	useLayoutEffect( () => {
		observe();
		return () => disconnect();
	}, [ disconnect, observe ] );

	return [ setNode, observerEntry ];
}

/**
 * Gets the drag position and timestamp from a mouse, touch, or pointer event.
 *
 * @param {Event} event - The event object from the drag/touch/pointer interaction
 * @return {object} Object containing x, y coordinates and timestamp of the event
 */
function getDragPositionAndTime( event ) {
	const { timeStamp } = event;
	if ( Object.prototype.hasOwnProperty.call( event, 'clientX' ) ) {
		return { x: event.clientX, y: event.clientY, timeStamp };
	}

	if ( event.targetTouches[ 0 ] ) {
		return {
			x: event.targetTouches[ 0 ].clientX,
			y: event.targetTouches[ 0 ].clientY,
			timeStamp,
		};
	}

	const touch = event.changedTouches[ 0 ];
	return { x: touch.clientX, y: touch.clientY, timeStamp };
}

/**
 * Calculates the total width needed for all pages in the swipeable component.
 *
 * @param {number} pageWidth - The width of a single page
 * @param {number} numPages  - The total number of pages
 * @return {number|null} The total width of all pages or null if pageWidth is not available
 */
function getPagesWidth( pageWidth, numPages ) {
	if ( ! pageWidth ) {
		return null;
	}
	return pageWidth * numPages;
}

export const Swipeable = ( {
	hasDynamicHeight = false,
	children,
	currentPage = 0,
	onPageSelect,
	pageClassName,
	containerClassName,
	isClickEnabled,
	...otherProps
} ) => {
	const prevPageRef = useRef( currentPage );
	const [ swipeableArea, setSwipeableArea ] = useState< DOMRect | null >( null );
	// TODO: Needs to be added RTL support
	const isRtl = false;

	const [ resizeObserverRef, entry ] = useResizeObserver();
	const [ isTransitioning, setIsTransitioning ] = useState( false );

	const [ pagesStyle, setPagesStyle ] = useState< PageStyle >( {
		transitionDuration: TRANSITION_DURATION,
	} );

	const [ dragData, setDragData ] = useState( null );

	const pagesRef = useRef< HTMLDivElement >( null );
	const numPages = Children.count( children );
	const containerWidth = entry?.contentRect?.width;

	useEffect( () => {
		let timeoutId: ReturnType< typeof setTimeout >;
		if (
			( currentPage === 0 && prevPageRef.current === numPages ) ||
			( currentPage === numPages - 1 && prevPageRef.current === -1 )
		) {
			// We are in a real slide after being transitioned from a clone
			// we need to set again the transitionDuration to TRANSITION_DURATION
			// But we need to wait a little bit to avoid enabling it before
			// we moved to the real slide
			timeoutId = setTimeout( () => {
				setPagesStyle( prev => ( { ...prev, transitionDuration: TRANSITION_DURATION } ) );
			}, 500 );
		} else if ( currentPage === numPages || currentPage < 0 ) {
			// In a clone slide. Start the transition to the real slide
			setIsTransitioning( true );
		}

		prevPageRef.current = currentPage;
		return () => {
			if ( timeoutId ) {
				clearTimeout( timeoutId );
			}
		};
	}, [ currentPage, numPages ] );

	const getOffset = useCallback(
		index => {
			// Adjust offset to account for the cloned element at the beginning
			const adjustedIndex = index + 1;
			const offset = containerWidth * adjustedIndex;
			return isRtl ? offset : -offset;
		},
		[ isRtl, containerWidth ]
	);

	const updateEnabled = hasDynamicHeight && numPages > 1;

	// Generate a property that denotes the order of the cards, in order to recalculate height whenever the card order changes.
	const childrenOrder = children.reduce( ( acc, child ) => acc + child.key, '' );

	useLayoutEffect( () => {
		if ( ! updateEnabled ) {
			// This is a fix for a bug when you have >1 pages and it update the component to just one but the height is still
			// Related to https://github.com/Automattic/dotcom-forge/issues/2033
			if ( pagesStyle?.height ) {
				setPagesStyle( { ...pagesStyle, height: undefined } );
			}
			return;
		}
		const targetHeight = ( pagesRef.current?.querySelector( '.is-current' ) as HTMLElement )
			?.offsetHeight;

		if ( targetHeight && pagesStyle?.height !== targetHeight ) {
			setPagesStyle( { ...pagesStyle, height: targetHeight } );
		}
	}, [ pagesRef, currentPage, pagesStyle, updateEnabled, containerWidth, childrenOrder ] );

	const resetDragData = useCallback( () => {
		setPagesStyle( prev => ( {
			...prev,
			transitionDuration: TRANSITION_DURATION,
		} ) );
		setDragData( null );
	}, [ setPagesStyle, setDragData ] );

	const handleDragStart = useCallback(
		event => {
			const position = getDragPositionAndTime( event );
			setSwipeableArea( pagesRef.current?.getBoundingClientRect() );
			setDragData( { start: position } );
			setPagesStyle( prev => ( { ...prev, transitionDuration: `0ms` } ) ); // Set transition Duration to 0 for smooth dragging.
		},
		[ setPagesStyle, setDragData ]
	);

	const hasSwipedToNextPage = useCallback( delta => ( isRtl ? delta > 0 : delta < 0 ), [ isRtl ] );
	const hasSwipedToPreviousPage = useCallback(
		delta => ( isRtl ? delta < 0 : delta > 0 ),
		[ isRtl ]
	);

	const handleTransitionEnd = useCallback( () => {
		if ( ! isTransitioning ) {
			return;
		}

		setIsTransitioning( false );

		// If we're on the clone slides, jump to the corresponding real slide
		// We set the transitionDuration to 0ms to make invisible the
		// change from the clone to the real slide
		if ( currentPage >= numPages ) {
			setPagesStyle( prev => ( { ...prev, transitionDuration: '0ms' } ) );
			onPageSelect( 0 );
		} else if ( currentPage < 0 ) {
			setPagesStyle( prev => ( { ...prev, transitionDuration: '0ms' } ) );
			onPageSelect( numPages - 1 );
		}
	}, [ currentPage, numPages, onPageSelect, isTransitioning ] );

	const handleDragEnd = useCallback(
		event => {
			if ( ! dragData ) {
				return; // End early if we are not dragging any more.
			}

			let dragPosition = getDragPositionAndTime( event );

			if ( dragPosition.x === 0 ) {
				dragPosition = dragData.last;
			}

			const delta = dragPosition.x - dragData.start.x;
			const absoluteDelta = Math.abs( delta );
			const velocity = absoluteDelta / ( dragPosition.timeStamp - dragData.start.timeStamp );

			const verticalAbsoluteDelta = Math.abs( dragPosition.y - dragData.start.y );
			const angle = ( Math.atan2( verticalAbsoluteDelta, absoluteDelta ) * 180 ) / Math.PI;

			// Is click or tap?
			if ( velocity === 0 && isClickEnabled ) {
				onPageSelect( ( currentPage + 1 ) % numPages );
				resetDragData();
				return;
			}

			// Is vertical scroll detected?
			if ( angle > VERTICAL_THRESHOLD_ANGLE ) {
				resetDragData();
				return;
			}

			const hasMetThreshold =
				absoluteDelta > OFFSET_THRESHOLD_PERCENTAGE * containerWidth ||
				velocity > VELOCITY_THRESHOLD;

			let newIndex = currentPage;

			if ( hasMetThreshold ) {
				if ( hasSwipedToNextPage( delta ) ) {
					newIndex = currentPage + 1;
					if ( newIndex >= numPages ) {
						setIsTransitioning( true );
					}
				} else if ( hasSwipedToPreviousPage( delta ) ) {
					newIndex = currentPage - 1;
					if ( newIndex < 0 ) {
						setIsTransitioning( true );
					}
				}
			}

			setPagesStyle( prev => ( {
				...prev,
				transform: `translate3d(${ getOffset( newIndex ) }px, 0px, 0px)`,
				transitionDuration: TRANSITION_DURATION,
			} ) );

			onPageSelect( newIndex );
			setDragData( null );
		},
		[
			currentPage,
			dragData,
			hasSwipedToNextPage,
			hasSwipedToPreviousPage,
			numPages,
			onPageSelect,
			setPagesStyle,
			containerWidth,
			isClickEnabled,
			resetDragData,
			getOffset,
		]
	);

	const handleDrag = useCallback(
		event => {
			if ( ! dragData ) {
				return;
			}

			const dragPosition = getDragPositionAndTime( event );
			const delta = dragPosition.x - dragData.start.x;
			const absoluteDelta = Math.abs( delta );
			const offset = getOffset( currentPage ) + delta;
			setDragData( { ...dragData, last: dragPosition } );
			// The user needs to swipe horizontally more then 2 px in order for the canvase to be dragging.
			// We do this so that the user can scroll vertically smother.
			if ( absoluteDelta < 3 ) {
				return;
			}

			setPagesStyle( prev => ( {
				...prev,
				transform: `translate3d(${ offset }px, 0px, 0px)`,
				transitionDuration: '0ms',
			} ) );

			if ( ! swipeableArea ) {
				return;
			}
			// Did the user swipe out of the swipeable area?
			if (
				dragPosition.x < swipeableArea.left ||
				dragPosition.x > swipeableArea.right ||
				dragPosition.y > swipeableArea.bottom ||
				dragPosition.y < swipeableArea.top
			) {
				handleDragEnd( event );
			}
		},
		[ dragData, getOffset, currentPage, swipeableArea, handleDragEnd ]
	);

	const getTouchEvents = useCallback( () => {
		if ( 'onpointerup' in document ) {
			return {
				onPointerDown: handleDragStart,
				onPointerMove: handleDrag,
				onPointerUp: handleDragEnd,
				onPointerLeave: handleDragEnd,
			};
		}

		if ( 'ondragend' in document ) {
			return {
				onDragStart: handleDragStart,
				onDrag: handleDrag,
				onDragEnd: handleDragEnd,
				onDragExit: handleDragEnd,
			};
		}

		if ( 'ontouchend' in document ) {
			return {
				onTouchStart: handleDragStart,
				onTouchMove: handleDrag,
				onTouchEnd: handleDragEnd,
				onTouchCancel: handleDragEnd,
			};
		}

		return null;
	}, [ handleDragStart, handleDrag, handleDragEnd ] );

	const offset = getOffset( currentPage );

	return (
		<>
			<div
				{ ...getTouchEvents() }
				className="swipeable__container"
				ref={ pagesRef }
				{ ...otherProps }
			>
				<div
					className={ clsx( 'swipeable__pages', containerClassName ) }
					style={ {
						...pagesStyle,
						width: getPagesWidth( containerWidth, numPages + 2 ),
						transform: `translate3d(${ offset }px, 0px, 0px)`,
					} }
					onTransitionEnd={ handleTransitionEnd }
				>
					{ /* Clone of the last element */ }
					<div
						style={ { width: `${ containerWidth }px` } }
						className={ clsx( 'swipeable__page', pageClassName, {
							'is-clone': true,
							'is-prev': currentPage === 0,
						} ) }
						key={ `clone-prev-${ numPages - 1 }` }
					>
						{ Children.toArray( children )[ numPages - 1 ] }
					</div>

					{ /* Original elements */ }
					{ Children.map( children, ( child, index ) => (
						<div
							style={ { width: `${ containerWidth }px` } }
							className={ clsx( 'swipeable__page', pageClassName, {
								'is-current': index === currentPage,
								'is-prev': index < currentPage,
								'is-next': index > currentPage,
							} ) }
							key={ `page-${ index }` }
							data-testid={ `swipeable-page-${ index + 1 }` }
						>
							{ child }
						</div>
					) ) }

					{ /* Clone of the first element */ }
					<div
						style={ { width: `${ containerWidth }px` } }
						className={ clsx( 'swipeable__page', pageClassName, {
							'is-clone': true,
							'is-next': currentPage === numPages - 1,
						} ) }
						key={ `clone-next-0` }
					>
						{ Children.toArray( children )[ 0 ] }
					</div>
				</div>
			</div>
			<div ref={ resizeObserverRef } className="swipeable__resize-observer"></div>
		</>
	);
};

export default Swipeable;
