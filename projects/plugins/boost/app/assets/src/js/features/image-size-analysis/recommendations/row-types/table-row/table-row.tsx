import React, { useState, useCallback } from 'react';
import clsx from 'clsx';
import styles from './table-row.module.scss';
import rowStyles from '../../row.module.scss';

interface TableRowProps {
	children: React.ReactNode;
	expandedContent?: React.ReactNode;
}

const TableRow: React.FC< TableRowProps > = ( { children, expandedContent } ) => {
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

	return (
		<div
			className={ clsx( styles[ 'table-row-container' ], {
				[ styles.expanded ]: expanded,
				[ rowStyles.expanded ]: expanded,
			} ) }
		>
			{ /* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */ }
			<div
				className={ clsx( rowStyles[ 'table-row' ], rowStyles[ 'row-grid' ] ) }
				onClick={ toggleExpand }
			>
				{ children }

				{ canExpand && (
					<div className={ styles[ 'expand-indicator' ] }>{ expanded ? '↑' : '↓' }</div>
				) }
			</div>

			{ expanded && canExpand && (
				<div className={ styles[ 'expanded-content-row' ] }>{ expandedContent }</div>
			) }
		</div>
	);
};

export default TableRow;
