/**
 * External dependencies
 */
import React from 'react';
import { Text } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const NavigationItem = React.forwardRef(
	( { onClick, onKeyDown, onFocus, selected, label, icon, vuls, isSubItem, disabled }, ref ) => {
		const wrapperClassName = classNames( styles[ 'navigation-item' ], {
			[ styles.clickable ]: ! disabled,
			[ styles.selected ]: selected,
		} );

		const labelClassname = classNames( styles[ 'navigation-item-label' ], {
			[ styles[ 'sub-item' ] ]: isSubItem,
		} );

		return (
			<li
				className={ wrapperClassName }
				onClick={ disabled ? null : onClick }
				onKeyDown={ onKeyDown }
				onFocus={ onFocus }
				role="menuitem"
				tabIndex={ disabled ? -1 : 0 }
				ref={ ref }
			>
				<Text className={ labelClassname }>
					{ icon && (
						<Icon icon={ icon } className={ styles[ 'navigation-item-icon' ] } size={ 28 } />
					) }
					{ label }
				</Text>
				{ Boolean( vuls ) && (
					<Text
						variant="body-extra-small"
						className={ styles[ 'navigation-item-badge' ] }
						component="div"
					>
						{ vuls }
					</Text>
				) }
			</li>
		);
	}
);

export default NavigationItem;
