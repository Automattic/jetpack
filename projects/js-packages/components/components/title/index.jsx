/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { Text } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

export const TIPOGRAPHY_SIZES = {
	medium: 'medium',
	small: 'small',
};

/**
 * Title component, based on Text component.
 *
 * @param {object} props                   - Component props.
 * @param {React.Component} props.size     - Heading size: 'medium' (default) | 'small'.
 * @param {React.Component} props.children - Heading component children.
 * @returns {React.Component}                Headline level 2 component instance.
 */
export const Title = ( { children, size = 'medium' } ) => (
	<Text variant={ `title-${ size }` } className={ styles[ `title-${ size }` ] }>
		{ children }
	</Text>
);

Title.propTypes = {
	size: PropTypes.oneOf( Object.values( TIPOGRAPHY_SIZES ) ),
};

Title.defaultProps = {
	size: TIPOGRAPHY_SIZES.medium,
};
