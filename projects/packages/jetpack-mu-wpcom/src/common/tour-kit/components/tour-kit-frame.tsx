import { arrow, flip, offset, shift, useFloating } from '@floating-ui/react-dom';
import { useViewportMatch } from '@wordpress/compose';
import { useEffect, useState, useCallback, useRef } from '@wordpress/element';
import clsx from 'clsx';
import useStepTracking from '../hooks/use-step-tracking';
import { classParser } from '../utils';
import { createLiveResizeAutoUpdate } from '../utils/live-resize';
import KeyboardNavigation from './keyboard-navigation';
import TourKitMinimized from './tour-kit-minimized';
import Overlay from './tour-kit-overlay';
import Spotlight from './tour-kit-spotlight';
import TourKitStep from './tour-kit-step';
import type { Callback, Config } from '../types';
import type { FunctionComponent, HTMLAttributes } from 'react';

const handleCallback = ( currentStepIndex: number, callback?: Callback ) => {
	typeof callback === 'function' && callback( currentStepIndex );
};

interface Props {
	config: Config;
}

const TourKitFrame: FunctionComponent< Props > = ( { config } ) => {
	const [ currentStepIndex, setCurrentStepIndex ] = useState( 0 );
	const [ initialFocusedElement, setInitialFocusedElement ] = useState< HTMLElement | null >(
		null
	);
	const [ isMinimized, setIsMinimized ] = useState( config.isMinimized ?? false );

	const arrowRef = useRef< HTMLDivElement >( null );
	const tourContainerRef = useRef( null );
	const isMobile = useViewportMatch( 'mobile', '<' );
	const lastStepIndex = config.steps.length - 1;
	const referenceElements = config.steps[ currentStepIndex ].referenceElements;
	const referenceElementSelector =
		referenceElements?.[ isMobile ? 'mobile' : 'desktop' ] || referenceElements?.desktop;
	const referenceElement = referenceElementSelector
		? document.querySelector< HTMLElement >( referenceElementSelector )
		: null;

	useEffect( () => {
		if ( config.isMinimized ) {
			setIsMinimized( true );
		}
	}, [ config.isMinimized ] );

	// Whether the arrow indicator is enabled for this step. Used both to reserve room for the arrow
	// in the floating element's offset and to render the arrow element. The whole frame stays hidden
	// until positioned (see `tourReady` and the `is-visible` class), so this doesn't gate on it.
	const arrowIndicatorEnabled =
		config.options?.effects?.arrowIndicator !== false && !! referenceElement && ! isMinimized;

	const showSpotlight = useCallback( () => {
		if ( ! config.options?.effects?.spotlight ) {
			return false;
		}

		return ! isMinimized;
	}, [ config.options?.effects?.spotlight, isMinimized ] );

	const showOverlay = useCallback( () => {
		if ( showSpotlight() || ! config.options?.effects?.overlay ) {
			return false;
		}

		return ! isMinimized;
	}, [ config.options?.effects?.overlay, isMinimized, showSpotlight ] );

	const handleDismiss = useCallback(
		( source: string ) => {
			return () => {
				config.closeHandler( config.steps, currentStepIndex, source );
			};
		},
		[ config, currentStepIndex ]
	);

	const handleNextStepProgression = useCallback( () => {
		let newStepIndex = currentStepIndex;
		if ( lastStepIndex > currentStepIndex ) {
			newStepIndex = currentStepIndex + 1;
			setCurrentStepIndex( newStepIndex );
		}
		handleCallback( newStepIndex, config.options?.callbacks?.onNextStep );
	}, [ config.options?.callbacks?.onNextStep, currentStepIndex, lastStepIndex ] );

	const handlePreviousStepProgression = useCallback( () => {
		let newStepIndex = currentStepIndex;
		if ( currentStepIndex > 0 ) {
			newStepIndex = currentStepIndex - 1;
			setCurrentStepIndex( newStepIndex );
		}
		handleCallback( newStepIndex, config.options?.callbacks?.onPreviousStep );
	}, [ config.options?.callbacks?.onPreviousStep, currentStepIndex ] );

	const handleGoToStep = useCallback(
		( stepIndex: number ) => {
			setCurrentStepIndex( stepIndex );
			handleCallback( stepIndex, config.options?.callbacks?.onGoToStep );
		},
		[ config.options?.callbacks?.onGoToStep ]
	);

	const handleMinimize = useCallback( () => {
		setIsMinimized( true );
		handleCallback( currentStepIndex, config.options?.callbacks?.onMinimize );
	}, [ config.options?.callbacks?.onMinimize, currentStepIndex ] );

	const handleMaximize = useCallback( () => {
		setIsMinimized( false );
		handleCallback( currentStepIndex, config.options?.callbacks?.onMaximize );
	}, [ config.options?.callbacks?.onMaximize, currentStepIndex ] );

	const arrowGap = arrowIndicatorEnabled ? 12 : 10;

	const { refs, floatingStyles, placement, middlewareData, isPositioned } = useFloating( {
		strategy: 'fixed',
		placement: config?.placement ?? 'bottom',
		elements: { reference: referenceElement },
		whileElementsMounted: createLiveResizeAutoUpdate( config.options?.effects?.liveResize ),
		middleware: [
			offset( arrowGap, [ arrowGap ] ),
			flip( { fallbackPlacements: [ 'top', 'left', 'right' ] } ),
			// `padding` matches the left/margin of the tour frame.
			shift( { padding: 16, rootBoundary: 'document' } ),
			arrow( { element: arrowRef, padding: 12 } ),
			...( config.options?.floatingMiddleware ?? [] ),
		],
	} );

	// Ready immediately when there's no reference element to position against, otherwise once
	// Floating UI has positioned the frame. Drives the `is-visible` class on the outer frame, which
	// keeps the whole tour `visibility: hidden` until it is correctly positioned.
	const tourReady = ! referenceElement || isPositioned;

	const { x: arrowX, y: arrowY } = middlewareData.arrow ?? {};

	// The outer `.tour-kit-frame` is hidden until `tourReady`, so positioning props are applied as
	// soon as there's a reference element. This also ensures the arrow element is mounted before
	// Floating UI computes its position, so the `arrow` middleware can measure it.
	const stepRepositionProps =
		! isMinimized && referenceElement
			? {
					style: floatingStyles,
					'data-placement': placement,
			  }
			: null;

	const arrowPositionProps =
		! isMinimized && referenceElement
			? {
					style: {
						left: arrowX != null ? `${ arrowX }px` : '',
						top: arrowY != null ? `${ arrowY }px` : '',
					},
			  }
			: null;

	/*
	 * Focus first interactive element when step renders.
	 */
	useEffect( () => {
		setTimeout( () => initialFocusedElement?.focus() );
	}, [ initialFocusedElement ] );

	useEffect( () => {
		if ( referenceElement && config.options?.effects?.autoScroll ) {
			referenceElement.scrollIntoView( config.options.effects.autoScroll );
		}
	}, [ config.options?.effects?.autoScroll, referenceElement ] );

	const classes = clsx(
		'tour-kit-frame',
		isMobile ? 'is-mobile' : 'is-desktop',
		{ 'is-visible': tourReady },
		classParser( config.options?.classNames )
	);

	useStepTracking( currentStepIndex, config.options?.callbacks?.onStepViewOnce );

	useEffect( () => {
		if ( config.options?.callbacks?.onStepView ) {
			handleCallback( currentStepIndex, config.options?.callbacks?.onStepView );
		}
	}, [ config.options?.callbacks?.onStepView, currentStepIndex ] );

	return (
		<>
			<KeyboardNavigation
				onMinimize={ handleMinimize }
				onDismiss={ handleDismiss }
				onNextStepProgression={ handleNextStepProgression }
				onPreviousStepProgression={ handlePreviousStepProgression }
				tourContainerRef={ tourContainerRef }
				isMinimized={ isMinimized }
			/>
			<div className={ classes } ref={ tourContainerRef }>
				{ showOverlay() && <Overlay visible /> }
				{ showSpotlight() && (
					<Spotlight
						referenceElement={ referenceElement }
						liveResize={ config.options?.effects?.liveResize || {} }
						{ ...( config.options?.effects?.spotlight || {} ) }
					/>
				) }
				<div
					className="tour-kit-frame__container"
					ref={ refs.setFloating }
					tabIndex={ -1 }
					{ ...( stepRepositionProps as HTMLAttributes< HTMLDivElement > ) }
				>
					{ arrowIndicatorEnabled && (
						<div
							className="tour-kit-frame__arrow"
							ref={ arrowRef }
							{ ...( arrowPositionProps as HTMLAttributes< HTMLDivElement > ) }
						/>
					) }
					{ ! isMinimized ? (
						<TourKitStep
							config={ config }
							steps={ config.steps }
							currentStepIndex={ currentStepIndex }
							onMinimize={ handleMinimize }
							onDismiss={ handleDismiss }
							onNextStep={ handleNextStepProgression }
							onPreviousStep={ handlePreviousStepProgression }
							onGoToStep={ handleGoToStep }
							setInitialFocusedElement={ setInitialFocusedElement }
						/>
					) : (
						<TourKitMinimized
							config={ config }
							steps={ config.steps }
							currentStepIndex={ currentStepIndex }
							onMaximize={ handleMaximize }
							onDismiss={ handleDismiss }
						/>
					) }
				</div>
			</div>
		</>
	);
};

export default TourKitFrame;
