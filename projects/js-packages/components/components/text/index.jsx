/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import styles from './style.module.scss';

export const VARIANTS_MAPPING = {
	'headline-medium': 'h1',
	'headline-small': 'h2',
	'headline-small-regular': 'h2',
	'title-medium': 'h3',
	'title-small': 'h4',
	body: 'p',
	'body-small': 'p',
	'body-extra-small': 'p',
	label: 'p',
};

export const TIPOGRAPHY_WEIGHTS = {
	regular: 'regular',
	bold: 'bold',
};

export const TIPOGRAPHY_SIZES = {
	medium: 'medium',
	small: 'small',
};

export const SPACING_VALUES = [ 0, 1, 2, 3, 4, 5, 6 ];

const Text = ( {
	variant,
	children,
	component,
	className,
	top = 0,
	right = 0,
	bottom = 0,
	left = 0,
	...componentProps
} ) => {
	const Component = component || VARIANTS_MAPPING[ variant ] || 'span';
	const componentClassName = classNames( styles[ variant ], className, {
		[ styles[ `top-${ top }` ] ]: top !== 0 ? styles[ `top-${ top }` ] : null,
		[ styles[ `right-${ right }` ] ]: right !== 0 ? styles[ `right-${ right }` ] : null,
		[ styles[ `bottom-${ bottom }` ] ]: bottom !== 0 ? styles[ `bottom-${ bottom }` ] : null,
		[ styles[ `left-${ left }` ] ]: left !== 0 ? styles[ `left-${ left }` ] : null,
	} );

	return (
		<Component className={ componentClassName } { ...componentProps }>
			{ children }
		</Component>
	);
};

Text.propTypes = {
	/** Variant name, based on our pre-defined names and design names. */
	variant: PropTypes.oneOf( Object.keys( VARIANTS_MAPPING ) ),
	/** Top spacing  */
	top: PropTypes.oneOf( SPACING_VALUES ),
	/** Right spacing  */
	right: PropTypes.oneOf( SPACING_VALUES ),
	/** Bottom spacing  */
	bottom: PropTypes.oneOf( SPACING_VALUES ),
	/** Left spacing  */
	left: PropTypes.oneOf( SPACING_VALUES ),
	/** The text itself that will be rendered. */
	children: PropTypes.node,
	/** Force an specific tag (span, div) or use a custom component that will receive className and children */
	component: PropTypes.oneOfType( [ PropTypes.elementType, PropTypes.string ] ),
};

Text.defaultProps = {
	variant: 'body',
	top: 0,
	right: 0,
	bottom: 0,
	left: 0,
	children: null,
	component: null,
};

export default Text;

/**
 * Heading component - Medium size.
 *
 * @param {object} props                   - Component props.
 * @param {React.Component} props.children - Heading component children.
 * @returns {React.Component}                Headline Medium size instance.
 */
export const H2 = ( { children } ) => (
	<Text variant="headline-medium" bottom={ 3 }>
		{ children }
	</Text>
);

H2.propTypes = {
	/** The text itself that will be rendered. */
	children: PropTypes.node,
};

H2.defaultProps = {
	children: null,
};

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
		<Text variant={ `headline-small${ weight?.length ? `-${ weight }` : '' }` } bottom={ 1 }>
			{ children }
		</Text>
	);
};

H3.propTypes = {
	/** Font weight: bold | regular  */
	weight: PropTypes.oneOf( Object.values( TIPOGRAPHY_WEIGHTS ) ),
	/** The text itself that will be rendered. */
	children: PropTypes.node,
};

H3.defaultProps = {
	weight: TIPOGRAPHY_WEIGHTS.bold,
	children: null,
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
	<Text variant={ `title-${ size }` } bottom={ 1 }>
		{ children }
	</Text>
);

Title.propTypes = {
	/** Font size: medium | small  */
	size: PropTypes.oneOf( Object.values( TIPOGRAPHY_SIZES ) ),
	/** The text itself that will be rendered. */
	children: PropTypes.node,
};

Title.defaultProps = {
	size: TIPOGRAPHY_SIZES.medium,
};
