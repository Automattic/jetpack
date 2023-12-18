import React, { useState, useCallback } from 'react';
import classnames from 'classnames';
interface TableRowProps {
	enableTransition: boolean;
	children: React.ReactNode;
	expandedContent?: React.ReactNode;
}

const TableRow: React.FC< TableRowProps > = ( { enableTransition, children, expandedContent } ) => {
	const canExpand = !! expandedContent;
	const [ expanded, setExpanded ] = useState( false );

	const toggleExpand = useCallback(
		( e: React.MouseEvent< HTMLDivElement > ) => {
			if ( ! canExpand ) {
				return;
			}

			// Don't expand if the user clicked a link or a button.
			if ( e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement ) {
				return;
			}

			setExpanded( ! expanded );
		},
		[ expanded, canExpand ]
	);

	const transitionDuration = enableTransition ? 250 : 0;
	const transitionStyle = {
		transition: `height ${ transitionDuration }ms ease-out`,
	};

	return (
		<div
			className={ classnames( 'jb-table-row-container', { expanded } ) }
			style={ transitionStyle }
		>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */ }
			<div className="jb-table-row jb-recommendation-page-grid" onClick={ toggleExpand }>
				{ children }

				{ canExpand && <div className="jb-table-row__expand">{ expanded ? '↑' : '↓' }</div> }
			</div>

			{ expanded && canExpand && <div className="jb-table-row__expanded">{ expandedContent }</div> }
		</div>
	);
};

export default TableRow;
