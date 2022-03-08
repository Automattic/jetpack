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

const VARIANTS_MAPPING = {
	'title-large': 'h1',
	'title-small': 'h2',
	body: 'p',
	'body-small': 'p',
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
	component: PropTypes.elementType,
};

Text.defaultProps = {
	variant: 'body',
	children: null,
	component: null,
};

export default Text;
