/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Text } from '@automattic/jetpack-components';
import { Icon } from '@wordpress/icons';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const ItemLabel = ( { icon, children, className } ) => {
	return (
		<Text className={ classNames( styles[ 'navigation-item-label' ], className ) }>
			{ icon && <Icon icon={ icon } className={ styles[ 'navigation-item-icon' ] } size={ 28 } /> }
			{ children }
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
