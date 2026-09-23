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
	FocusEvent,
	KeyboardEvent,
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
	hoverShow = false,
	wide = false,
	inline = true,
	shift = false,
} ) => {
	const POPOVER_HELPER_WIDTH = 124;
	const [ isVisible, setIsVisible ] = useState( false );
	const [ hoverTimeout, setHoverTimeout ] = useState( null );
	const wrapperRef = useRef< HTMLDivElement >( null );
	const popoverRef = useRef< HTMLDivElement >( null );
	// Where focus should land after Tab leaves the tooltip. The effect below applies it, rather
	// than the handler, because Popover puts focus back on the trigger as it unmounts.
	const focusAfterClose = useRef< HTMLElement | null >( null );
	// Opening on hover must not pull focus off whatever the visitor is using.
	const openedByHover = useRef( false );
	const hideTooltip = useCallback( () => setIsVisible( false ), [ setIsVisible ] );
	const toggleTooltip = useCallback(
		e => {
			e.preventDefault();
			openedByHover.current = false;
			setIsVisible( ! isVisible );
		},
		[ isVisible, setIsVisible ]
	);

	const isAnchorWrapper = popoverAnchorStyle === 'wrapper';
	const isForcedToShow = isAnchorWrapper && forceShow;

	const handlePopoverKeyDown = useCallback(
		( event: KeyboardEvent< HTMLDivElement > ) => {
			const wrapper = wrapperRef.current;
			const popover = popoverRef.current;
			if ( event.key !== 'Tab' || ! wrapper || ! popover ) {
				return;
			}
			const tabbables = focus.tabbable.find( popover );
			const boundary = event.shiftKey ? tabbables[ 0 ] : tabbables[ tabbables.length - 1 ];
			const leaving =
				! tabbables.length ||
				event.target === boundary ||
				( event.shiftKey && event.target === popover );
			if ( ! leaving ) {
				return;
			}
			// A popover rendered in a portal sits at the end of the document, so Tab out of it has
			// to resume from the trigger's place in the page instead of the popover's.
			const step = event.shiftKey ? focus.tabbable.findPrevious : focus.tabbable.findNext;
			let destination = step( wrapper );
			while (
				destination &&
				( wrapper.contains( destination ) || popover.contains( destination ) )
			) {
				destination = step( destination );
			}
			event.preventDefault();
			focusAfterClose.current = destination ?? null;
			hideTooltip();
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
		// Focusing the popover itself puts Escape in reach even with nothing tabbable inside.
		// A caller-controlled popover keeps the old behaviour until it can report dismissal.
		focusOnMount: isForcedToShow ? 'firstElement' : ! openedByHover.current,
		// Tab moves through the popover in document order rather than cycling inside it, and
		// handlePopoverKeyDown decides where it lands on the way out.
		constrainTabbing: false,
		onKeyDownCapture: handlePopoverKeyDown,
		ref: popoverRef,
		onClose: hideTooltip,
		onFocusOutside: ( event: FocusEvent ) => {
			// A pointer press on our own trigger dismisses through that trigger instead.
			if ( ! wrapperRef.current?.contains( event.relatedTarget as Node ) ) {
				hideTooltip();
			}
		},
		className: clsx( 'icon-tooltip-container', popoverClassName ),
		inline,
		shift,
	} satisfies Omit< React.ComponentProps< typeof Popover >, 'children' >;

	const wrapperClassNames = clsx( 'icon-tooltip-wrapper', className );
	const iconShiftBySize = {
		left: isAnchorWrapper ? 0 : -( POPOVER_HELPER_WIDTH / 2 - iconSize / 2 ) + 'px',
	};

	useEffect( () => {
		if ( isForcedToShow || isVisible ) {
			return;
		}
		const destination = focusAfterClose.current;
		focusAfterClose.current = null;
		destination?.focus();
	}, [ isForcedToShow, isVisible ] );

	const handleMouseEnter = useCallback( () => {
		if ( hoverShow ) {
			if ( hoverTimeout ) {
				clearTimeout( hoverTimeout );
				setHoverTimeout( null );
			}
			openedByHover.current = true;
			setIsVisible( true );
		}
	}, [ hoverShow, hoverTimeout ] );

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
			ref={ wrapperRef }
			className={ wrapperClassNames }
			data-testid="icon-tooltip_wrapper"
			onMouseEnter={ handleMouseEnter }
			onMouseLeave={ handleMouseLeave }
		>
			{ ! isAnchorWrapper && (
				<Button variant="link" aria-expanded={ isVisible } onClick={ toggleTooltip }>
					<Icon className={ iconClassName } icon={ iconCode } size={ iconSize } />
				</Button>
			) }
			<div
				className={ clsx( 'icon-tooltip-helper', { 'is-wide': wide } ) }
				style={ iconShiftBySize }
			>
				{ ( isForcedToShow || isVisible ) && (
					<Popover { ...args }>
						<div>
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
