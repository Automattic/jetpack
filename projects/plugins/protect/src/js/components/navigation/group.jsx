/**
 * External dependencies
 */
import React from 'react';
// import classNames from 'classnames';
import ItemLabel from './label';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const NavigationGroup = ( { icon, label, children } ) => {
	return (
		<li tabIndex={ -1 } role="menuitem" className={ styles[ 'navigation-group' ] }>
			<ItemLabel icon={ icon } className={ styles[ 'navigation-group-label' ] }>
				{ label }
			</ItemLabel>
			<ul className={ styles[ 'navigation-group-content' ] }>{ children }</ul>
		</li>
	);
};

export default NavigationGroup;
