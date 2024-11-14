import { forwardRef, useCallback } from '@wordpress/element';
import clsx from 'clsx';
import { kebabCase, map } from 'lodash';

const stopPropagation = event => event.stopPropagation();

const TableItem = ( { columns, item, isSelected, onSelectChange }, ref ) => {
	const handleChange = useCallback( () => onSelectChange( item.id ), [ item.id, onSelectChange ] );

	const classes = clsx( 'jp-forms__table-item', item.className, {
		'is-active': ! item.isLoading && item.isActive,
		'is-clickable': ! item.isLoading && item.onClick,
		'is-loading': item.isLoading,
		'is-selected': ! item.isLoading && isSelected,
	} );

	return (
		/* eslint-disable-next-line jsx-a11y/click-events-have-key-events,jsx-a11y/no-static-element-interactions */
		<div ref={ ref } className={ classes } onClick={ item.onClick }>
			{ !! onSelectChange && (
				<div className="jp-forms__table-cell is-select">
					{ ! item.isLoading && (
						<input
							className="jp-forms__table-checkbox"
							type="checkbox"
							onClick={ stopPropagation }
							onChange={ handleChange }
							checked={ isSelected }
						/>
					) }
				</div>
			) }

			{ map( columns, ( { additionalClassNames, getValue, key }, index ) => {
				const value = getValue ? getValue( item ) : item[ key ];

				const cellClasses = clsx(
					'jp-forms__table-cell',
					`is-${ kebabCase( key ) }`,
					additionalClassNames
				);

				if ( item.isLoading ) {
					return <div key={ `table-${ key }-${ index }-loading` } className={ cellClasses } />;
				}

				return (
					<div key={ `table-${ key }-${ item.id }` } className={ cellClasses }>
						{ value }
					</div>
				);
			} ) }
		</div>
	);
};

export default forwardRef( TableItem );
