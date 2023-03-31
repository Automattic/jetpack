import { useCallback } from '@wordpress/element';
import classnames from 'classnames';
import { difference, includes, kebabCase, map, without } from 'lodash';
import TableItem from './item';

import './style.scss';

const Table = ( { className, columns, items, selectedResponses = [], setSelectedResponses } ) => {
	const toggleSelected = useCallback(
		id => {
			const newState = includes( selectedResponses, id )
				? without( selectedResponses, id )
				: [ ...selectedResponses, id ];

			setSelectedResponses( newState );
		},
		[ selectedResponses, setSelectedResponses ]
	);
	const selectAll = useCallback( () => {
		if ( difference( map( items, 'id' ), selectedResponses ).length === 0 ) {
			setSelectedResponses( [] );
			return;
		}

		const newState = map( items, 'id' );
		setSelectedResponses( newState );
	}, [ items, selectedResponses, setSelectedResponses ] );

	const classes = classnames( 'jp-forms__table', className );
	const checkboxClasses = classnames( 'jp-forms__table-checkbox', {
		'is-intermediate': selectedResponses.length !== 0 && selectedResponses.length !== items.length,
	} );

	return (
		<div className={ classes }>
			<div className="jp-forms__table-header">
				{ !! setSelectedResponses && (
					<div className="jp-forms__table-cell is-select">
						<input
							className={ checkboxClasses }
							onChange={ selectAll }
							type="checkbox"
							checked={ difference( map( items, 'id' ), selectedResponses ).length === 0 }
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
					isSelected={ includes( selectedResponses, item.id ) }
					onSelectChange={ setSelectedResponses && toggleSelected }
				/>
			) ) }
		</div>
	);
};

export default Table;
