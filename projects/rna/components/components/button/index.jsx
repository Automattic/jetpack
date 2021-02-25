/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import './style.scss';

const Button = props => {
	const element = props.href ? 'a' : 'button';
	const { primary, compact, scary, borderless, className, ...elementProps } = props;

	const buttonClasses = classNames( {
		'dops-button': true,
		'is-compact': compact,
		'is-primary': primary,
		'is-scary': scary,
		'is-borderless': borderless,
	} );

	elementProps.className = classNames( className, buttonClasses );

	return React.createElement( element, elementProps, props.children );
};

Button.propTypes = {
	disabled: PropTypes.bool,
	compact: PropTypes.bool,
	primary: PropTypes.bool,
	scary: PropTypes.bool,
	type: PropTypes.string,
	href: PropTypes.string,
	onClick: PropTypes.func,
	borderless: PropTypes.bool,
	className: PropTypes.string,
};

Button.defaultProps = {
	disabled: false,
	type: 'button',
	onClick: () => {},
	borderless: false,
};

Button.displayName = 'Button';

export default Button;
