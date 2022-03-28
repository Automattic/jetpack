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

export const TIPOGRAPHY_SIZES = {
	medium: 'medium',
	small: 'small',
};

const typographiesPropTypes = {
	weight: PropTypes.oneOf( Object.values( TIPOGRAPHY_WEIGHTS ) ),
};

const typographiesDefaults = {
	weight: TIPOGRAPHY_WEIGHTS.bold,
};

/**
 * Component to compose the Text instances,
 * according to root variant and weight.
 *
 * @param {object} props                   - Component props.
 * @param {string} props.rootVariant       - Root variant of the Text instance.
 * @param {string} props.weight            - Weight of the Text instance (bold|regular).
 * @param {React.Component} props.children - Text children component.
 * @returns {React.Component}                Text component instance.
 */
function TextComposer( { children, rootVariant, weight } ) {
	weight = weight === 'bold' ? '' : weight;

	return (
		<Text
			variant={ `${ rootVariant }${ weight?.length ? `-${ weight }` : '' }` }
			className={ styles[ rootVariant ] }
		>
			{ children }
		</Text>
	);
}

export const H2 = ( { children, weight } ) => (
	<TextComposer rootVariant="headline-medium" weight={ weight }>
		{ children }
	</TextComposer>
);
H2.propTypes = typographiesPropTypes;
H2.defaultProps = typographiesDefaults;

export const H3 = ( { children, weight } ) => (
	<TextComposer rootVariant="headline-small" weight={ weight }>
		{ children }
	</TextComposer>
);
H3.propTypes = typographiesPropTypes;
H3.defaultProps = typographiesDefaults;

export const Title = ( { children, size = 'medium' } ) => (
	<TextComposer rootVariant={ `title-${ size }` }>{ children }</TextComposer>
);

Title.propTypes = {
	size: PropTypes.oneOf( Object.values( TIPOGRAPHY_SIZES ) ),
};

Title.defaultProps = {
	size: TIPOGRAPHY_SIZES.medium,
};
