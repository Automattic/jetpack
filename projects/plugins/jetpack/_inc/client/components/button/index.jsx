import clsx from 'clsx';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

export default class Button extends React.Component {
	static displayName = 'Button';

	static propTypes = {
		disabled: PropTypes.bool,
		compact: PropTypes.bool,
		primary: PropTypes.bool,
		scary: PropTypes.bool,
		type: PropTypes.string,
		href: PropTypes.string,
		onClick: PropTypes.func,
		borderless: PropTypes.bool,
		rna: PropTypes.bool,
		className: PropTypes.string,
	};

	static defaultProps = {
		disabled: false,
		type: 'button',
		onClick: noop,
		borderless: false,
	};

	domNode = null;

	render() {
		const element = this.props.href ? 'a' : 'button';
		const { primary, compact, scary, borderless, rna, className, ...props } = this.props;

		const buttonClasses = clsx( {
			'dops-button': true,
			'is-compact': compact,
			'is-primary': primary,
			'is-scary': scary,
			'is-borderless': borderless,
			'is-rna': rna,
		} );

		props.className = clsx( className, buttonClasses );
		props.ref = node => ( this.domNode = node );

		return React.createElement( element, props, this.props.children );
	}
}
