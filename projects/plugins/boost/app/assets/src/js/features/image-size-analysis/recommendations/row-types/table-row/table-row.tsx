import React, { useState, useCallback } from 'react';
import classnames from 'classnames';
interface TableRowProps {
	expandable: boolean;
	enableTransition: boolean;
	children: React.ReactNode;
	expandedContent: React.ReactNode;
}

const TableRow: React.FC< TableRowProps > = ( {
	expandable,
	enableTransition,
	children,
	expandedContent,
} ) => {
	const [ expanded, setExpanded ] = useState( false );

	const toggleExpand = useCallback(
		( e: React.MouseEvent< HTMLDivElement > ) => {
			if ( ! expandable ) {
				return;
			}

			// Don't expand if the user clicked a link or a button.
			if ( e.target instanceof HTMLAnchorElement || e.target instanceof HTMLButtonElement ) {
				return;
			}

			setExpanded( ! expanded );
		},
		[ expandable, expanded ]
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

				{ expandable && <div className="jb-table-row__expand">{ expanded ? '↑' : '↓' }</div> }
			</div>

			{ expanded && expandable && (
				<div className="jb-table-row__expanded">{ expandedContent }</div>
			) }
		</div>
	);
};

export default TableRow;
