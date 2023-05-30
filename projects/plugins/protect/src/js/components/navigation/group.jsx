import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState, useCallback, useContext } from 'react';
import NavigationItem from './item';
import styles from './styles.module.scss';
import { NavigationContext } from './use-menu-navigation';

const MAX_ITEMS = 8;

const NavigationGroup = ( {
	id: groupId,
	icon,
	badge,
	label,
	items,
	checked: groupChecked,
	onChecked,
} ) => {
	const context = useContext( NavigationContext );
	const [ expanded, setExpanded ] = useState( false );

	const { mode } = useContext( NavigationContext );
	const needsTruncate = Array.isArray( items ) && items?.length >= MAX_ITEMS && mode === 'list';
	const content = needsTruncate && ! expanded ? items.slice( 0, MAX_ITEMS ) : items;
	const totalHideItems = needsTruncate ? items?.length - MAX_ITEMS : 0;

	const groupIsSelected =
		context?.selectedItemId === groupId || context?.selectedItem?.parentId === groupId;

	const handleExpandedToggle = useCallback( () => {
		setExpanded( current => ! current );
	}, [] );

	return (
		<li tabIndex={ -1 } role="menuitem" className={ styles[ 'navigation-group' ] }>
			<NavigationItem
				id={ groupId }
				label={ label }
				icon={ icon }
				badge={ badge }
				disabled={ content?.length <= 0 }
				onClick={ onChecked }
				checked={ groupChecked }
			/>
			{ groupIsSelected && (
				<div className={ styles[ 'navigation-group-list' ] }>
					<ul className={ styles[ 'navigation-group-content' ] }>
						{ content.map( ( { name, threats, checked: itemChecked, onClick } ) => (
							<NavigationItem
								key={ name }
								id={ name }
								parentId={ groupId }
								label={ name }
								checked={ itemChecked }
								badge={ threats?.length }
								disabled={ threats?.length <= 0 }
								onClick={ onClick }
							/>
						) ) }
					</ul>
					{ needsTruncate && (
						<div className={ styles[ 'navigation-group-truncate' ] }>
							<Button variant="link" onClick={ handleExpandedToggle }>
								{ expanded
									? sprintf(
											/* translators: %s: Number of hide items  */
											__( 'Hide %s items', 'jetpack-protect' ),
											totalHideItems
									  )
									: sprintf(
											/* translators: %s: Number of hide items  */
											__( 'Show %s more', 'jetpack-protect' ),
											totalHideItems
									  ) }
							</Button>
						</div>
					) }
				</div>
			) }
		</li>
	);
};

export default NavigationGroup;
