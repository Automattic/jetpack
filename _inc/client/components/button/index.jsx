/**
 * External dependencies
 */
import PropTypes from 'prop-types';

import React from 'react';
import classNames from 'classnames';
import noop from 'lodash/noop';

require( './style.scss' );

export default React.createClass( {

	displayName: 'Button',

	propTypes: {
		disabled: PropTypes.bool,
		compact: PropTypes.bool,
		primary: PropTypes.bool,
		scary: PropTypes.bool,
		type: PropTypes.string,
		href: PropTypes.string,
		onClick: PropTypes.func,
		borderless: PropTypes.bool,
		className: PropTypes.string
	},

	getDefaultProps() {
		return {
			disabled: false,
			type: 'button',
			onClick: noop,
			borderless: false
		};
	},

	render() {
		const element = this.props.href ? 'a' : 'button';
		let { primary, compact, scary, borderless, className, ...props } = this.props;

		const buttonClasses = classNames( {
			'dops-button': true,
			'is-compact': compact,
			'is-primary': primary,
			'is-scary': scary,
			'is-borderless': borderless
		} );

		props.className = classNames( className, buttonClasses );

		return React.createElement( element, props, this.props.children );
	}
} );
