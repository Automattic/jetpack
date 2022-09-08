import { Popover } from '@wordpress/components';
import { useDebounce } from '@wordpress/compose';
import classNames from 'classnames';
import React, { useState } from 'react';
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
	title,
	children,
} ) => {
	const delay = 300;
	const [ isVisible, setIsVisible ] = useState( false );
	const delayedSetIsOver = useDebounce( setIsVisible, delay );

	const createToggleIsOver = ( eventName, isDelayed = false ) => {
		return event => {
			event.stopPropagation();
			event.preventDefault();
			const _isVisible = [ 'focus', 'mouseenter' ].includes( event.type );
			if ( _isVisible === isVisible ) {
				return;
			}

			if ( isDelayed ) {
				delayedSetIsOver( _isVisible );
			} else {
				setIsVisible( _isVisible );
			}
		};
	};

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

	const wrapperClassNames = classNames( 'icon-tooltip-wrapper', className );

	return (
		<div className={ wrapperClassNames } data-testid="icon-tooltip_wrapper">
			<span
				style={ { cursor: 'pointer' } }
				onMouseEnter={ createToggleIsOver( 'onMouseEnter', true ) }
				onMouseLeave={ createToggleIsOver( 'onMouseLeave' ) }
			>
				<Gridicon className={ iconClassName } icon={ args.iconCode } size={ 18 } />
			</span>

			<div className="icon-tooltip-helper">
				{ isVisible && <Popover { ...args }>{ args.children }</Popover> }
			</div>
		</div>
	);
};

export default IconTooltip;
