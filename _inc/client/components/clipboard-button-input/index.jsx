/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import omit from 'lodash/omit';

/**
 * Internal dependencies
 */
import ClipboardButton from 'components/form/clipboard-button';
import TextInput from 'components/text-input';

import './style.scss';

export default class ClipboardButtonInput extends React.Component {
	static displayName = 'ClipboardButtonInput';

	static propTypes = {
		value: PropTypes.string,
		disabled: PropTypes.bool,
		className: PropTypes.string,
		copied: PropTypes.string,
		copy: PropTypes.string,
		prompt: PropTypes.string,
	};

	static defaultProps = {
		value: '',
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
		const forwardedProps = omit(
			this.props,
			'className',
			'copied',
			'copy',
			'isError',
			'isValid',
			'prompt',
			'selectOnFocus'
		);

		return (
			<span className={ classnames( 'dops-clipboard-button-input', this.props.className ) }>
				<TextInput { ...forwardedProps } type="text" selectOnFocus readOnly />
				<ClipboardButton
					text={ this.props.value }
					onCopy={ this.showConfirmation }
					disabled={ this.props.disabled }
					prompt={ this.props.prompt }
					compact
				>
					{ this.state.isCopied ? this.props.copied : this.props.copy }
				</ClipboardButton>
			</span>
		);
	}
}
