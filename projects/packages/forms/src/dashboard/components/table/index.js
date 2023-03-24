import { useCallback, useState } from '@wordpress/element';
import classnames from 'classnames';
import { difference, includes, kebabCase, map, without } from 'lodash';
import TableItem from './item';

import './style.scss';

const Table = ( { className, columns, defaultSelected, items, onSelectionChange } ) => {
	const [ selected, setSelected ] = useState( defaultSelected || [] );

	const toggleSelected = useCallback(
		id => {
			const newState = includes( selected, id ) ? without( selected, id ) : [ ...selected, id ];

			setSelected( newState );
			onSelectionChange( newState );
		},
		[ selected, onSelectionChange ]
	);
	const selectAll = useCallback( () => {
		if ( difference( map( items, 'id' ), selected ).length === 0 ) {
			setSelected( [] );
			onSelectionChange( [] );
			return;
		}

		const newState = map( items, 'id' );
		setSelected( newState );
		onSelectionChange( newState );
	}, [ items, selected, onSelectionChange ] );

	const classes = classnames( 'jp-forms__table', className );
	const checkboxClasses = classnames( 'jp-forms__table-checkbox', {
		'is-intermediate': selected.length !== 0 && selected.length !== items.length,
	} );

	return (
		<div className={ classes }>
			<div className="jp-forms__table-header">
				{ !! onSelectionChange && (
					<div className="jp-forms__table-cell is-select">
						<input
							className={ checkboxClasses }
							onChange={ selectAll }
							type="checkbox"
							checked={ difference( map( items, 'id' ), selected ).length === 0 }
						/>
					</div>
				) }

				{ map( columns, ( { label, key } ) => {
					const headerClasses = classnames( 'jp-forms__table-cell', `is-${ kebabCase( key ) }` );

					return (
						<div key={ `table-header-${ key }` } className={ headerClasses }>
							{ label }
						</div>
					);
				} ) }
			</div>

			{ map( items, item => (
				<TableItem
					key={ `table-row-${ item.id }` }
					columns={ columns }
					item={ item }
					isSelected={ includes( selected, item.id ) }
					onSelectChange={ onSelectionChange && toggleSelected }
				/>
			) ) }
		</div>
	);
};

export default Table;
