import { Fragment } from '@wordpress/element';
import classnames from 'classnames';
import { kebabCase, map } from 'lodash';

const TableItem = ( { columns, item, isSelected, onSelectChange } ) => {
	const handleChange = () => onSelectChange( item.id );

	const classes = classnames( 'jp-forms__table-item', {
		'is-selected': isSelected,
	} );

	return (
		<div className={ classes }>
			{ !! onSelectChange && (
				<div className="jp-forms__table-cell is-select">
					<input
						className="jp-forms__table-checkbox"
						type="checkbox"
						onChange={ handleChange }
						checked={ isSelected }
					/>
				</div>
			) }

			{ map( columns, ( { additionalClassNames, component, getProps, key } ) => {
				let Wrapper = Fragment;
				let props = [];

				if ( component ) {
					Wrapper = component;
					props = getProps ? getProps( item ) : item;
				}

				const cellClasses = classnames(
					'jp-forms__table-cell',
					`is-${ kebabCase( key ) }`,
					additionalClassNames
				);

				return (
					<div key={ `table-${ key }-${ item.id }` } className={ cellClasses }>
						<Wrapper { ...props }>{ item[ key ] }</Wrapper>
					</div>
				);
			} ) }
		</div>
	);
};

export default TableItem;
