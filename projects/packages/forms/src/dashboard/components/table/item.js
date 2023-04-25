import { Fragment, useCallback } from '@wordpress/element';
import classnames from 'classnames';
import { kebabCase, map } from 'lodash';

const stopPropagation = event => event.stopPropagation();

const TableItem = ( { columns, item, isSelected, onSelectChange } ) => {
	const handleChange = useCallback( () => onSelectChange( item.id ), [ item.id, onSelectChange ] );

	const classes = classnames( 'jp-forms__table-item', {
		'is-active': item.isActive,
		'is-clickable': item.onClick,
		'is-selected': isSelected,
	} );

	return (
		/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
		<div className={ classes } onClick={ item.onClick }>
			{ !! onSelectChange && (
				<div className="jp-forms__table-cell is-select">
					<input
						className="jp-forms__table-checkbox"
						type="checkbox"
						onClick={ stopPropagation }
						onChange={ handleChange }
						checked={ isSelected }
					/>
				</div>
			) }

			{ map( columns, ( { additionalClassNames, component, getProps, key } ) => {
				let Wrapper = Fragment;
				let props = {};

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
