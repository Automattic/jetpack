import './style.scss';
import { useEffect, useState } from '@wordpress/element';
import { buildNestedTreeItems } from './utils';
// import sampleCategories from './mock-data';

const TreeSelector = props => {
	const { items, onSelect, onDeselect, onChange } = props;

	const [ checkedItems, setCheckedItems ] = useState( [] );
	const [ nestedTreeItems, setNestedTreeItems ] = useState( buildNestedTreeItems( items ) );

	useEffect( () => {
		onChange( checkedItems );
	}, [ checkedItems, onChange ] );

	useEffect( () => {
		setNestedTreeItems( buildNestedTreeItems( items ) );
	}, [ items ] );

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
					<li key={ item.ID } className="jp-tree-item">
						<input
							type="checkbox"
							id={ `jp-tree-item-${ item.ID }` }
							name="jp-tree-item"
							checked={ checkedItems.some( checkedItem => checkedItem.ID === item.ID ) }
							onChange={ handleChange( item ) }
						/>
						<label htmlFor={ `jp-tree-item-${ item.ID }` }>{ item.name }</label>
						{ item.children && item.children.length > 0 && renderTreeItems( item.children ) }
					</li>
				) ) }
			</ul>
		);
	};

	return renderTreeItems( nestedTreeItems );
};

export default TreeSelector;
