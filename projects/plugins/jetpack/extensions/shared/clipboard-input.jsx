import { CopyToClipboard } from '@automattic/jetpack-components';
import { TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './clipboard-input.scss';

const ClipboardInput = ( { link } ) => {
	return (
		<div className="jetpack-clipboard-input">
			<TextControl
				readOnly
				value={ link }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
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
