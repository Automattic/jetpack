import { ClipboardIconButton } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { InputControl, InputLayout } from '@wordpress/ui';

const ClipboardInput = ( { link } ) => {
	return (
		<InputControl
			label={ __( 'Shortlink', 'jetpack' ) }
			hideLabelFromVision
			readOnly
			dir="ltr"
			value={ link }
			suffix={
				<InputLayout.Slot padding="minimal">
					<ClipboardIconButton text={ link } size="small" />
				</InputLayout.Slot>
			}
		/>
	);
};

export default ClipboardInput;
