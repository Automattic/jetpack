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
	( { onClick, onKeyDown, onFocus, selected, label, icon, vuls, isSubItem }, ref ) => {
		const wrapperClassName = classNames( styles[ 'navigation-item' ], {
			[ styles.clickable ]: Boolean( onClick ),
			[ styles.selected ]: selected,
		} );

		const labelClassname = classNames( styles[ 'navigation-item-label' ], {
			[ styles[ 'sub-item' ] ]: isSubItem,
		} );

		return (
			<li
				className={ wrapperClassName }
				onClick={ onClick }
				onKeyDown={ onKeyDown }
				onFocus={ onFocus }
				role="menuitem"
				tabIndex={ 0 }
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
