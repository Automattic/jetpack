/**
 * External dependencies
 */
import React from 'react';
import { Text } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import styles from './styles.module.scss';

const ItemBadge = ( { children } ) => {
	return (
		<Text
			variant="body-extra-small"
			className={ styles[ 'navigation-item-badge' ] }
			component="div"
		>
			{ children }
		</Text>
	);
};

ItemBadge.propTypes = {
	/* Element that will be rendered as children */
	children: PropTypes.node.isRequired,
};

export default ItemBadge;
