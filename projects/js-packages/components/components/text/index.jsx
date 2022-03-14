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

const Text = ( { variant, children, component, className, ...componentProps } ) => {
	const Component = component || VARIANTS_MAPPING[ variant ] || 'span';
	const componentClassName = classNames( styles[ variant ], className );
	return (
		<Component className={ componentClassName } { ...componentProps }>
			{ children }
		</Component>
	);
};

Text.propTypes = {
	variant: PropTypes.oneOf( Object.keys( VARIANTS_MAPPING ) ),
	children: PropTypes.node,
	component: PropTypes.oneOfType( [ PropTypes.elementType, PropTypes.string ] ),
};

Text.defaultProps = {
	variant: 'body',
	children: null,
	component: null,
};

export default Text;
