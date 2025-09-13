import clsx from 'clsx';
import { createRef, Component } from 'react';

import './style.scss';

export default class TextInput extends Component {
	static displayName = 'TextInput';

	static defaultProps = {
		isError: false,
		isValid: false,
		selectOnFocus: false,
		type: 'text',
	};

	textFieldRef = createRef();

	focus = () => {
		this.textFieldRef.current.focus();
	};

	render() {
		const { className, selectOnFocus, isError, isValid, ...forwardedProps } = this.props;
		const classes = clsx( className, {
			'dops-text-input': true,
			'is-error': isError,
			'is-valid': isValid,
		} );
		return (
			<input
				{ ...forwardedProps }
				ref={ this.textFieldRef }
				className={ classes }
				onClick={ selectOnFocus ? this.selectOnFocus : null }
			/>
		);
	}

	selectOnFocus = event => {
		event.target.select();
	};
}
