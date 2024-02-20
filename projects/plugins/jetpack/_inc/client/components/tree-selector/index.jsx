import './style.scss';
import { useEffect, useState } from '@wordpress/element';
import { createFlatTreeItems } from './utils';

const TreeSelector = props => {
	const { items, onSelect, onDeselect, onChange, keyword = '' } = props;

	const flatTreeItems = createFlatTreeItems( items );

	const isSearching = keyword?.trim() !== '';

	const filteredTreeItems = isSearching
		? flatTreeItems.filter( item => item.name.toLowerCase().includes( keyword?.toLowerCase() ) )
		: flatTreeItems;

	const [ checkedItems, setCheckedItems ] = useState( [] );

	useEffect( () => {
		onChange( checkedItems );
	}, [ checkedItems, onChange ] );

	const handleChange = item => e => {
		const isChecked = e.target.checked;

		let newCheckedItems;
		if ( isChecked ) {
			newCheckedItems = [ ...checkedItems, item ];
			onSelect( item );
		} else {
			newCheckedItems = checkedItems.filter( checkedItem => checkedItem.ID !== item.ID );
			onDeselect( item );
		}

		setCheckedItems( newCheckedItems );
	};

	const renderTreeItems = treeItems => {
		return (
			<ul className="jp-tree-items">
				{ treeItems.map( item => (
					<li
						key={ item.ID }
						className="jp-tree-item"
						style={ { marginLeft: isSearching ? 0 : item.depth * 25 } }
					>
						<input
							type="checkbox"
							id={ `jp-tree-item-${ item.ID }` }
							name="jp-tree-item"
							checked={ checkedItems.some( checkedItem => checkedItem.ID === item.ID ) }
							onChange={ handleChange( item ) }
						/>
						<label htmlFor={ `jp-tree-item-${ item.ID }` }>
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
				) ) }
			</ul>
		);
	};

	return renderTreeItems( filteredTreeItems );
};

export default TreeSelector;
