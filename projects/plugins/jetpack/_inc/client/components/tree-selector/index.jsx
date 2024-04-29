import { CheckboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import './style.scss';
import { createFlatTreeItems } from './utils';

const TreeSelector = props => {
	const { items, onChange, selectedItems, disabled, keyword = '' } = props;

	const flatTreeItems = createFlatTreeItems( items );

	const isSearching = keyword?.trim() !== '';

	const filteredTreeItems = isSearching
		? flatTreeItems.filter( item => item.name.toLowerCase().includes( keyword?.toLowerCase() ) )
		: flatTreeItems;

	const toggleCheckbox = useCallback(
		id => () => onChange( id, ! selectedItems.includes( id ) ),
		[ onChange, selectedItems ]
	);

	const treeElements = filteredTreeItems.map( item => (
		<li
			key={ item.id }
			className="jp-tree-item"
			style={ { marginLeft: isSearching ? 0 : item.depth * 25 } }
		>
			<CheckboxControl
				id={ `jp-tree-item-${ item.id }` }
				name="jp-tree-item"
				checked={ selectedItems.includes( item.id ) }
				onChange={ toggleCheckbox( item.id ) }
				disabled={ disabled }
			/>
			<label htmlFor={ `jp-tree-item-${ item.id }` }>
				{ item.name }
				{ isSearching && item.parentNames.length > 0 ? (
					<>
						&nbsp;
						<small>({ [ ...item.parentNames, item.name ].join( ' > ' ) })</small>
					</>
				) : (
					<></>
				) }
			</label>
		</li>
	) );

	return (
		<ul className="jp-tree-items">
			{ isSearching && filteredTreeItems.length === 0 ? (
				<li className="jp-tree-item jp-tree-item__no-results">
					<span>{ __( 'Nothing found', 'jetpack' ) }</span>
				</li>
			) : (
				treeElements
			) }
		</ul>
	);
};

export default TreeSelector;
