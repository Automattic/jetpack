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

export const BOX_MODEL_VALUES = [
	'mt',
	'mr',
	'mb',
	'ml',
	'mx',
	'my',
	'm',
	'pt',
	'pr',
	'pb',
	'pl',
	'px',
	'py',
	'p',
];

export const SPACING_VALUES = [ 0, 1, 2, 3, 4, 5, 6, 7, 8 ];

const Text = ( { variant, children, component, className, ...componentProps } ) => {
	const Component = component || VARIANTS_MAPPING[ variant ] || 'span';

	// Build Styles module CSS classnames.
	const boxModelClasses = BOX_MODEL_VALUES.reduce( ( acc, value ) => {
		if ( typeof componentProps[ value ] !== 'undefined' ) {
			acc += styles[ `${ value }-${ componentProps[ value ] }` ] + ' ';
			// pick spacing prop. Do not pass down to Component.
			delete componentProps[ value ];
		}
		return acc;
	}, '' );

	return (
		<Component
			className={ classNames( styles[ variant ], className, boxModelClasses ) }
			{ ...componentProps }
		>
			{ children }
		</Component>
	);
};

Text.propTypes = {
	/** Variant name, based on our pre-defined names and design names. */
	variant: PropTypes.oneOf( Object.keys( VARIANTS_MAPPING ) ),
	/** margin */
	m: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-top */
	mt: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-right */
	mr: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-bottom */
	mb: PropTypes.oneOf( SPACING_VALUES ),
	/** margin-left */
	ml: PropTypes.oneOf( SPACING_VALUES ),
	/** margin left and right */
	mx: PropTypes.oneOf( SPACING_VALUES ),
	/** margin top and bottom */
	my: PropTypes.oneOf( SPACING_VALUES ),
	/** padding */
	p: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-top */
	pt: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-right */
	pr: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-bottom */
	pb: PropTypes.oneOf( SPACING_VALUES ),
	/** padding-left */
	pl: PropTypes.oneOf( SPACING_VALUES ),
	/** padding left and right */
	px: PropTypes.oneOf( SPACING_VALUES ),
	/** padding top and bottom */
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
		<Text variant={ `headline-small${ weight?.length ? `-${ weight }` : '' }` } mb={ 3 }>
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
