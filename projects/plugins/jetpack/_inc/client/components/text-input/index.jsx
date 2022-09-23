import classNames from 'classnames';
import { omit } from 'lodash';
import React from 'react';

import './style.scss';

export default class TextInput extends React.Component {
	static displayName = 'TextInput';

	static defaultProps = {
		isError: false,
		isValid: false,
		selectOnFocus: false,
		type: 'text',
	};

	focus = () => {
		this.refs.textField.focus();
	};

	render() {
		const { className, selectOnFocus } = this.props;
		const classes = classNames( className, {
			'dops-text-input': true,
			'is-error': this.props.isError,
			'is-valid': this.props.isValid,
		} );
		const forwardedProps = omit( this.props, 'selectOnFocus', 'isError', 'isValid' );
		return (
			<input
				{ ...forwardedProps }
				ref="textField"
				className={ classes }
				onClick={ selectOnFocus ? this.selectOnFocus : null }
			/>
		);
	}

	selectOnFocus = event => {
		event.target.select();
	};
}
