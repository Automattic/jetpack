import { Popover } from '@wordpress/components';
import { focus } from '@wordpress/dom';
import { Icon, info } from '@wordpress/icons';
import clsx from 'clsx';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	ReactElement,
	FC,
	KeyboardEvent,
	FocusEvent as ReactFocusEvent,
} from 'react';
import Button from '../button/index.tsx';
import { IconTooltipProps, Placement, Position } from './types.ts';

import './style.scss';

const placementsToPositions = ( placement: Placement ): Position => {
	const mapping = {
		'top-end': 'top left',
		top: 'top center',
		'top-start': 'top right',
		'bottom-end': 'bottom left',
		bottom: 'bottom center',
		'bottom-start': 'bottom right',
	};

	return mapping[ placement ] as Position;
};

/**
 * Generate Icon Tooltip
 *
 * @param {IconTooltipProps} props - Props
 * @return {ReactElement} - JSX element
 */
const IconTooltip: FC< IconTooltipProps > = ( {
	className = '',
	popoverClassName,
	iconClassName = '',
	placement = 'bottom-end',
	animate = true,
	iconCode = info,
	iconSize = 18,
	offset = 10,
	title,
	children,
	popoverAnchorStyle = 'icon',
	forceShow = false,
	onClose,
	triggerRef,
	hoverShow = false,
	wide = false,
	inline = true,
	shift = false,
} ) => {
	const POPOVER_HELPER_WIDTH = 124;
	const [ isVisible, setIsVisible ] = useState( false );
	const [ openedByHover, setOpenedByHover ] = useState( false );
	const [ hoverTimeout, setHoverTimeout ] = useState( null );
	const popoverRef = useRef< HTMLDivElement >( null );
	const contentRef = useRef< HTMLDivElement >( null );
	const iconTriggerRef = useRef< HTMLButtonElement >( null );
	const activeTriggerRef = triggerRef ?? iconTriggerRef;
	const returnFocusOnClose = useRef( false );
	const onCloseRef = useRef( onClose );
	// A held pointer press must leave the controlled trigger open until its click toggles it.
	const pointerReturningToTrigger = useRef( false );
	useEffect( () => {
		onCloseRef.current = onClose;
	}, [ onClose ] );
	const hideTooltip = useCallback( () => {
		setIsVisible( false );
		onCloseRef.current?.();
	}, [] );
	const toggleTooltip = useCallback(
		e => {
			e.preventDefault();
			setOpenedByHover( false );
			setIsVisible( ! isVisible );
		},
		[ isVisible, setIsVisible ]
	);

	const handleKeyDown = useCallback(
		( event: KeyboardEvent< HTMLButtonElement > ) => {
			if ( event.key === 'Enter' || event.key === ' ' ) {
				toggleTooltip( event );
			} else if ( event.key === 'Escape' && isVisible ) {
				event.stopPropagation();
				hideTooltip();
			}
		},
		[ toggleTooltip, isVisible, hideTooltip ]
	);

	const handlePopoverKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			if ( event.key !== 'Tab' || ! contentRef.current ) {
				return;
			}
			const tabbables = focus.tabbable.find( contentRef.current );
			const boundary = event.shiftKey ? tabbables[ 0 ] : tabbables[ tabbables.length - 1 ];
			if (
				! tabbables.length ||
				event.target === boundary ||
				( event.shiftKey && event.target === popoverRef.current )
			) {
				event.preventDefault();
				event.stopPropagation();
				returnFocusOnClose.current = true;
				hideTooltip();
			}
		},
		[ hideTooltip ]
	);

	const args = {
		// To be compatible with deprecating prop `position`.
		position: placementsToPositions( placement ),
		placement,
		animate,
		noArrow: false,
		resize: false,
		flip: false,
		offset, // The distance (in px) between the anchor and the popover.
		focusOnMount: forceShow || ! openedByHover,
		onKeyDownCapture: handlePopoverKeyDown,
		ref: popoverRef,
		onClose: hideTooltip,
		onFocusOutside: event => {
			if (
				! pointerReturningToTrigger.current ||
				! triggerRef?.current?.contains( ( event as ReactFocusEvent ).relatedTarget as Node )
			) {
				hideTooltip();
			}
		},
		className: clsx( 'icon-tooltip-container', popoverClassName ),
		inline,
		shift,
	} satisfies Omit< React.ComponentProps< typeof Popover >, 'children' >;

	const isAnchorWrapper = popoverAnchorStyle === 'wrapper';

	const wrapperClassNames = clsx( 'icon-tooltip-wrapper', className );
	const iconShiftBySize = {
		left: isAnchorWrapper ? 0 : -( POPOVER_HELPER_WIDTH / 2 - iconSize / 2 ) + 'px',
	};

	const isForcedToShow = isAnchorWrapper && forceShow;

	useEffect( () => {
		if ( ! ( isForcedToShow || isVisible ) && returnFocusOnClose.current ) {
			returnFocusOnClose.current = false;
			activeTriggerRef.current?.focus();
		}
		const trigger = triggerRef?.current;
		if ( ! trigger || ! ( isForcedToShow || isVisible ) ) {
			return;
		}
		const ownerDocument = trigger.ownerDocument;
		const handleMouseDown = ( event: MouseEvent ) => {
			pointerReturningToTrigger.current = trigger.contains( event.target as Node );
		};
		const handleFocus = ( event: FocusEvent ) => {
			if ( returnFocusOnClose.current ) {
				return;
			}
			if (
				! popoverRef.current?.contains( event.target as Node ) &&
				! ( pointerReturningToTrigger.current && trigger.contains( event.target as Node ) )
			) {
				hideTooltip();
			}
		};
		const handleTriggerKeyDown = ( event: globalThis.KeyboardEvent ) => {
			pointerReturningToTrigger.current = false;
			if ( event.key === 'Escape' && trigger.contains( event.target as Node ) ) {
				event.stopPropagation();
				hideTooltip();
			}
		};
		ownerDocument.addEventListener( 'focusin', handleFocus );
		ownerDocument.addEventListener( 'mousedown', handleMouseDown, true );
		// Capture Escape before the trigger or portaled popover can stop its propagation.
		ownerDocument.addEventListener( 'keydown', handleTriggerKeyDown, true );
		return () => {
			pointerReturningToTrigger.current = false;
			ownerDocument.removeEventListener( 'focusin', handleFocus );
			ownerDocument.removeEventListener( 'mousedown', handleMouseDown, true );
			ownerDocument.removeEventListener( 'keydown', handleTriggerKeyDown, true );
		};
	}, [ activeTriggerRef, triggerRef, isForcedToShow, isVisible, hideTooltip ] );

	const handleMouseEnter = useCallback( () => {
		if ( hoverShow ) {
			if ( hoverTimeout ) {
				clearTimeout( hoverTimeout );
				setHoverTimeout( null );
			}
			if ( ! isVisible ) {
				setOpenedByHover( true );
				setIsVisible( true );
			}
		}
	}, [ hoverShow, hoverTimeout, isVisible ] );

	const handleMouseLeave = useCallback( () => {
		if ( hoverShow ) {
			const id = setTimeout( () => {
				setIsVisible( false );
				setHoverTimeout( null );
			}, 100 );
			setHoverTimeout( id );
		}
	}, [ hoverShow ] );

	return (
		<div
			className={ wrapperClassNames }
			data-testid="icon-tooltip_wrapper"
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
		>
			{ ! isAnchorWrapper && (
				<Button
					ref={ iconTriggerRef }
					variant="link"
					aria-expanded={ isVisible }
					onMouseDown={ toggleTooltip }
					onKeyDown={ handleKeyDown }
				>
					<Icon className={ iconClassName } icon={ iconCode } size={ iconSize } />
				</Button>
			) }
			<div
				className={ clsx( 'icon-tooltip-helper', { 'is-wide': wide } ) }
				style={ iconShiftBySize }
			>
				{ ( isForcedToShow || isVisible ) && (
					<Popover { ...args }>
						<div ref={ contentRef }>
							{ title && <div className="icon-tooltip-title">{ title }</div> }
							<div className="icon-tooltip-content">{ children }</div>
						</div>
					</Popover>
				) }
			</div>
		</div>
	);
};

export default IconTooltip;
