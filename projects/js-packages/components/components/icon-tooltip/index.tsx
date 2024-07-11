import { Popover } from '@wordpress/components';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import Button from '../button';
import Gridicon from '../gridicon/index';
import { IconTooltipProps, Placement, Position } from './types';

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
 * @returns {React.ReactElement} - JSX element
 */
const IconTooltip: React.FC< IconTooltipProps > = ( {
	className = '',
	iconClassName = '',
	placement = 'bottom-end',
	animate = true,
	iconCode = 'info-outline',
	iconSize = 18,
	offset = 10,
	title,
	children,
	popoverAnchorStyle = 'icon',
	forceShow = false,
	wide = false,
	inline = true,
	shift = false,
} ) => {
	const POPOVER_HELPER_WIDTH = 124;
	const [ isVisible, setIsVisible ] = useState( false );
	const hideTooltip = useCallback( () => setIsVisible( false ), [ setIsVisible ] );
	const toggleTooltip = useCallback(
		e => {
			e.preventDefault();
			setIsVisible( ! isVisible );
		},
		[ isVisible, setIsVisible ]
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
		focusOnMount: 'container' as const,
		onClose: hideTooltip,
		className: 'icon-tooltip-container',
		inline,
		shift,
	};

	const isAnchorWrapper = popoverAnchorStyle === 'wrapper';

	const wrapperClassNames = clsx( 'icon-tooltip-wrapper', className );
	const iconShiftBySize = {
		left: isAnchorWrapper ? 0 : -( POPOVER_HELPER_WIDTH / 2 - iconSize / 2 ) + 'px',
	};

	const isForcedToShow = isAnchorWrapper && forceShow;

	return (
		<div className={ wrapperClassNames } data-testid="icon-tooltip_wrapper">
			{ ! isAnchorWrapper && (
				<Button variant="link" onMouseDown={ toggleTooltip }>
					<Gridicon className={ iconClassName } icon={ iconCode } size={ iconSize } />
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
