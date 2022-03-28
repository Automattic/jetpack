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

export const TIPOGRAPHY_WEIGHTS = {
	regular: 'regular',
	bold: 'bold',
};

/**
 * Heading component - Medium size,
 * based on Text component.
 *
 * @param {object} props                   - Component props.
 * @param {React.Component} props.children - Heading component children.
 * @returns {React.Component}                Headline Medium size instance.
 */
export const H2 = ( { children } ) => (
	<Text variant="headline-medium" className={ styles[ 'headline-medium' ] }>
		{ children }
	</Text>
);

/**
 * Heading component - Small size,
 * based on Text component.
 *
 * @param {object} props                   - Component props.
 * @param {string} props.weight            - Font weight: 'bold' (default) | 'regular'.
 * @param {React.Component} props.children - Heading component children.
 * @returns {React.Component}                Headline Small size instance.
 */
export const H3 = ( { children, weight = 'bold' } ) => {
	weight = weight === 'bold' ? '' : weight;

	return (
		<Text
			variant={ `headline-small${ weight?.length ? `-${ weight }` : '' }` }
			className={ styles[ 'headline-small' ] }
		>
			{ children }
		</Text>
	);
};

H3.propTypes = {
	weight: PropTypes.oneOf( Object.values( TIPOGRAPHY_WEIGHTS ) ),
};

H3.defaultProps = {
	weight: TIPOGRAPHY_WEIGHTS.bold,
};
