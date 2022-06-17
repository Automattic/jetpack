import { ClipboardButton, TextControl } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

import './clipboard-input.scss';

class ClipboardInput extends Component {
	state = {
		hasCopied: false,
	};

	onCopy = () => this.setState( { hasCopied: true } );

	onFinishCopy = () => this.setState( { hasCopied: false } );

	onFocus = event => event.target.select();

	render() {
		const { link } = this.props;
		const { hasCopied } = this.state;

		if ( ! link ) {
			return null;
		}

		return (
			<div className="jetpack-clipboard-input">
				<TextControl readOnly onFocus={ this.onFocus } value={ link } />
				<ClipboardButton
					variant="secondary"
					onCopy={ this.onCopy }
					onFinishCopy={ this.onFinishCopy }
					text={ link }
				>
					{ hasCopied ? __( 'Copied!', 'jetpack' ) : _x( 'Copy', 'verb', 'jetpack' ) }
				</ClipboardButton>
			</div>
		);
	}
}

export default ClipboardInput;
