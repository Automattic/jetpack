import { Popover } from '@wordpress/components';
import React, { useState, useCallback } from 'react';
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
	placement = 'bottom-end',
	animate = true,
	iconCode = 'info-outline',
	title,
	children,
} ) => {
	const [ isVisible, setIsVisible ] = useState( false );

	const memoizedToggler = useCallback( () => {
		setIsVisible( state => ! state );
	}, [] );

	const args = {
		iconCode,
		children: (
			<div>
				<div className="icon-tooltip-title">{ title }</div>
				<div className="icon-tooltip-content">{ children }</div>
			</div>
		),
		// To be compatible with deprecating option `position`
		position: placementsToPositions( placement ),
		placement,
		animate,
		noArrow: false,
		resize: false,
		flip: false,
		offset: 10,
	};

	return (
		<div className="icon-tooltip-wrapper" data-testid="icon-tooltip_wrapper">
			<div className="icon-tooltip-helper">
				<span onMouseEnter={ memoizedToggler } onMouseLeave={ memoizedToggler }>
					<Gridicon icon={ args.iconCode } size={ 18 } />
				</span>
			</div>

			{ isVisible && <Popover { ...args }>{ args.children }</Popover> }
		</div>
	);
};

export default IconTooltip;
