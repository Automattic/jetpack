import { Text } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './styles.module.scss';

const ItemLabel = ( { icon, children, className } ) => {
	return (
		<Text className={ clsx( styles[ 'navigation-item-label' ], className ) }>
			{ icon && <Icon icon={ icon } className={ styles[ 'navigation-item-icon' ] } size={ 28 } /> }
			<span className={ styles[ 'navigation-item-label-content' ] }>{ children }</span>
		</Text>
	);
};

ItemLabel.propTypes = {
	/* An icon that will be rendered before text */
	icon: PropTypes.node,
	/* Label text that will be rendered */
	children: PropTypes.node.isRequired,
};

export default ItemLabel;
