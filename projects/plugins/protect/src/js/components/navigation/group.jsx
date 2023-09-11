import { Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useState, useCallback, useContext } from 'react';
import ItemLabel from './label';
import styles from './styles.module.scss';
import { NavigationContext } from './use-menu-navigation';

const MAX_ITEMS = 8;

const NavigationGroup = ( { icon, label, children } ) => {
	const [ collapsed, setCollapsed ] = useState( true );
	const { mode } = useContext( NavigationContext );
	const needsTruncate =
		Array.isArray( children ) && children?.length >= MAX_ITEMS && mode === 'list';
	const content = needsTruncate && collapsed ? children.slice( 0, MAX_ITEMS ) : children;
	const totalHideItems = needsTruncate ? children?.length - MAX_ITEMS : 0;

	const handleCollapsedToggle = useCallback( () => {
		setCollapsed( current => ! current );
	}, [] );

	return (
		<li tabIndex={ -1 } role="menuitem" className={ styles[ 'navigation-group' ] }>
			<ItemLabel icon={ icon } className={ styles[ 'navigation-group-label' ] }>
				{ label }
			</ItemLabel>
			<div className={ styles[ 'navigation-group-list' ] }>
				<ul className={ styles[ 'navigation-group-content' ] }>{ content }</ul>
				{ needsTruncate && (
					<div className={ styles[ 'navigation-group-truncate' ] }>
						<Button variant="link" onClick={ handleCollapsedToggle }>
							{ collapsed
								? sprintf(
										/* translators: %s: Number of hide items  */
										__( 'Show %s more', 'jetpack-protect' ),
										totalHideItems
								  )
								: sprintf(
										/* translators: %s: Number of hide items  */
										__( 'Hide %s items', 'jetpack-protect' ),
										totalHideItems
								  ) }
						</Button>
					</div>
				) }
			</div>
		</li>
	);
};

export default NavigationGroup;
