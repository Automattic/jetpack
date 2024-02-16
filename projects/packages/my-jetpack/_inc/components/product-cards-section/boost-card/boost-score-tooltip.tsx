import { Popover } from '@wordpress/components';
import React from 'react';
import type { FC, ReactNode } from 'react';

type VirtualElement = Pick< Element, 'getBoundingClientRect' > & {
	ownerDocument?: Document;
};

interface Props {
	isVisible: boolean;
	children: ReactNode;
	placement?:
		| 'top'
		| 'top-start'
		| 'top-end'
		| 'right'
		| 'right-start'
		| 'right-end'
		| 'bottom'
		| 'bottom-start'
		| 'bottom-end'
		| 'left'
		| 'left-start'
		| 'left-end'
		| 'overlay';
	offset?: number;
	anchor?: Element | VirtualElement;
}

const BoostScoreTooltip: FC< Props > = ( {
	isVisible,
	children,
	placement = 'right',
	offset,
	anchor,
} ) => {
	return (
		isVisible && (
			<div className={ 'boost-score-tooltip' }>
				<Popover placement={ placement } noArrow={ false } offset={ offset } anchor={ anchor }>
					{ children }
				</Popover>
			</div>
		)
	);
};

export default BoostScoreTooltip;
