/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import noop from 'lodash/noop';

require( './style.scss' );

export default React.createClass( {

	displayName: 'Button',

	propTypes: {
		disabled: React.PropTypes.bool,
		compact: React.PropTypes.bool,
		primary: React.PropTypes.bool,
		scary: React.PropTypes.bool,
		type: React.PropTypes.string,
		href: React.PropTypes.string,
		onClick: React.PropTypes.func,
		borderless: React.PropTypes.bool,
		className: React.PropTypes.string
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
