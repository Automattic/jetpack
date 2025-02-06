/**
 * External dependencies
 */
import { createRef, useCallback, useEffect, useRef } from '@wordpress/element';
import clsx from 'clsx';
import { difference, forEach, includes, kebabCase, map, without } from 'lodash';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
/**
 * Internal dependencies
 */
import TableItem from './item';

import './style.scss';

const getItemKey = ( item, index ) =>
	`table-row-${ item.isLoading ? `${ index }-loading` : item.id }`;

const Table = ( {
	className,
	columns,
	items,
	rowAnimationTimeout = 0,
	selectedResponses = [],
	setSelectedResponses,
} ) => {
	const { current: refs } = useRef( {} );

	useEffect( () => {
		forEach( items, item => {
			if ( refs[ getItemKey( item ) ] ) {
				return;
			}

			refs[ getItemKey( item ) ] = createRef();
		} );
	}, [ items, refs ] );

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

	const classes = clsx( 'jp-forms__table', className );
	const checkboxClasses = clsx( 'jp-forms__table-checkbox', {
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
					const headerClasses = clsx( 'jp-forms__table-cell', `is-${ kebabCase( key ) }` );

					return (
						<div key={ `table-header-${ key }` } className={ headerClasses }>
							{ label }
						</div>
					);
				} ) }
			</div>

			<TransitionGroup component={ null }>
				{ map( items, ( item, index ) => (
					<CSSTransition
						key={ getItemKey( item, index ) }
						nodeRef={ refs[ getItemKey( item, index ) ] }
						mountOnEnter={ !! rowAnimationTimeout }
						mountOnExit={ !! rowAnimationTimeout }
						timeout={ rowAnimationTimeout }
					>
						<TableItem
							ref={ refs[ getItemKey( item, index ) ] }
							columns={ columns }
							item={ item }
							isSelected={ includes( selectedResponses, item.id ) }
							onSelectChange={ setSelectedResponses && toggleSelected }
						/>
					</CSSTransition>
				) ) }
			</TransitionGroup>
		</div>
	);
};

export default Table;
