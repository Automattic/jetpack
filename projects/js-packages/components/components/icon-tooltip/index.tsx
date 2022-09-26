import { Popover } from '@wordpress/components';
import classNames from 'classnames';
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
} ) => {
	const POPOVER_HELPER_WIDTH = 124;
	const [ isVisible, setIsVisible ] = useState( false );
	const showTooltip = useCallback( () => setIsVisible( true ), [ setIsVisible ] );
	const hideTooltip = useCallback( () => setIsVisible( false ), [ setIsVisible ] );

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
	};

	const wrapperClassNames = classNames( 'icon-tooltip-wrapper', className );
	const iconShiftBySize = {
		left: -( POPOVER_HELPER_WIDTH / 2 - iconSize / 2 ) + 'px',
	};

	return (
		<div className={ wrapperClassNames } data-testid="icon-tooltip_wrapper">
			<Button variant="link" onClick={ showTooltip }>
				<Gridicon className={ iconClassName } icon={ iconCode } size={ iconSize } />
			</Button>

			<div className="icon-tooltip-helper" style={ iconShiftBySize }>
				{ isVisible && (
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
