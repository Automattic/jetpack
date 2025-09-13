import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Component } from 'react';
import ClipboardButton from 'components/form/clipboard-button';
import TextInput from 'components/text-input';

import './style.scss';

export default class ClipboardButtonInput extends Component {
	static displayName = 'ClipboardButtonInput';

	static propTypes = {
		value: PropTypes.string,
		disabled: PropTypes.bool,
		className: PropTypes.string,
		copied: PropTypes.string,
		copy: PropTypes.string,
		prompt: PropTypes.string,
		rna: PropTypes.bool,
	};

	static defaultProps = {
		value: '',
		rna: false,
	};

	state = {
		isCopied: false,
		disabled: false,
	};

	componentWillUnmount() {
		clearTimeout( this.confirmationTimeout );
		delete this.confirmationTimeout;
	}

	showConfirmation = () => {
		this.setState( {
			isCopied: true,
		} );

		this.confirmationTimeout = setTimeout( () => {
			this.setState( {
				isCopied: false,
			} );
		}, 4000 );
	};

	render() {
		const {
			className,
			copied,
			copy,
			isError,
			isValid,
			prompt,
			selectOnFocus,
			rna,
			...forwardedProps
		} = this.props;

		return (
			<span className={ clsx( 'dops-clipboard-button-input', className ) }>
				<TextInput { ...forwardedProps } type="text" selectOnFocus readOnly />
				<ClipboardButton
					text={ this.props.value }
					onCopy={ this.showConfirmation }
					disabled={ this.props.disabled }
					prompt={ prompt }
					compact
					rna={ rna }
				>
					{ this.state.isCopied ? copied : copy }
				</ClipboardButton>
			</span>
		);
	}
}
