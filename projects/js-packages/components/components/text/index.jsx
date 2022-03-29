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
	m,
	mt,
	mr,
	mb,
	ml,
	mx,
	my,
	p,
	pt,
	pr,
	pb,
	pl,
	px,
	py,
	...componentProps
} ) => {
	const Component = component || VARIANTS_MAPPING[ variant ] || 'span';
	const componentClassName = classNames( styles[ variant ], className, {
		[ styles[ `m-${ m }` ] ]: typeof m !== 'undefined' ? styles[ `m-${ m }` ] : null,
		[ styles[ `mt-${ mt }` ] ]: typeof mt !== 'undefined' ? styles[ `mt-${ mt }` ] : null,
		[ styles[ `mr-${ mr }` ] ]: typeof mr !== 'undefined' ? styles[ `mr-${ mr }` ] : null,
		[ styles[ `mb-${ mb }` ] ]: typeof mb !== 'undefined' ? styles[ `mb-${ mb }` ] : null,
		[ styles[ `ml-${ ml }` ] ]: typeof ml !== 'undefined' ? styles[ `ml-${ ml }` ] : null,
		[ styles[ `mx-${ mx }` ] ]: typeof mx !== 'undefined' ? styles[ `mx-${ mx }` ] : null,
		[ styles[ `my-${ my }` ] ]: typeof my !== 'undefined' ? styles[ `my-${ my }` ] : null,
		[ styles[ `p-${ p }` ] ]: typeof p !== 'undefined' ? styles[ `p-${ p }` ] : null,
		[ styles[ `pt-${ pt }` ] ]: typeof pt !== 'undefined' ? styles[ `pt-${ pt }` ] : null,
		[ styles[ `pr-${ pr }` ] ]: typeof pr !== 'undefined' ? styles[ `pr-${ pr }` ] : null,
		[ styles[ `pb-${ pb }` ] ]: typeof pb !== 'undefined' ? styles[ `pb-${ pb }` ] : null,
		[ styles[ `pl-${ pl }` ] ]: typeof pl !== 'undefined' ? styles[ `pl-${ pl }` ] : null,
		[ styles[ `px-${ px }` ] ]: typeof px !== 'undefined' ? styles[ `px-${ px }` ] : null,
		[ styles[ `py-${ py }` ] ]: typeof py !== 'undefined' ? styles[ `py-${ py }` ] : null,
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
	/** margin value, based on --spacing-base  */
	m: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-top value, based on --spacing-base  */
	mt: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-rigt value, based on --spacing-base  */
	mr: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-bottom value, based on --spacing-base  */
	mb: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-left value, based on --spacing-base  */
	ml: PropTypes.oneOf( SPACING_VALUES ),
	/** margin left ad right value, based on --spacing-base  */
	mx: PropTypes.oneOf( SPACING_VALUES ),
	/** margin top ad bottom value, based on --spacing-base  */
	my: PropTypes.oneOf( SPACING_VALUES ),
	/** padding value, based on --spacing-base  */
	p: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-top value, based on --spacing-base  */
	pt: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-right value, based on --spacing-base  */
	pr: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-bottom value, based on --spacing-base  */
	pb: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-left value, based on --spacing-base  */
	pl: PropTypes.oneOf( SPACING_VALUES ),
	/** padding left ad right value, based on --spacing-base  */
	px: PropTypes.oneOf( SPACING_VALUES ),
	/** padding top ad bottom value, based on --spacing-base  */
	py: PropTypes.oneOf( SPACING_VALUES ),
	/** The text itself that will be rendered. */
	children: PropTypes.node,
	/** Force an specific tag (span, div) or use a custom component that will receive className and children */
	component: PropTypes.oneOfType( [ PropTypes.elementType, PropTypes.string ] ),
};

Text.defaultProps = {
	variant: 'body',
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
	<Text variant="headline-medium" mb={ 3 }>
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
		<Text variant={ `headline-small${ weight?.length ? `-${ weight }` : '' }` } mb={ 1 }>
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
	<Text variant={ `title-${ size }` } mb={ 1 }>
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
