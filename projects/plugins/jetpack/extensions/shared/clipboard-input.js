import { CopyToClipboard } from '@automattic/jetpack-components';
import { TextControl } from '@wordpress/components'; // So this is what needs changing.
import { __ } from '@wordpress/i18n';

import './clipboard-input.scss';

const ClipboardInput = () => {
	const { link } = this.props;

	if ( ! link ) {
		return null;
	}

	return (
		<div className="jetpack-clipboard-input">
			<TextControl
				readOnly
				onFocus={ this.onFocus }
				value={ link }
				__nextHasNoMarginBottom={ true }
			/>
			<CopyToClipboard
				buttonStyle="icon-text"
				className="components-clipboard-button"
				textToCopy={ link }
				variant="secondary"
				weight="regular"
			>
				{ __( 'Copy', 'jetpack' ) }
			</CopyToClipboard>
		</div>
	);
};

export default ClipboardInput;
