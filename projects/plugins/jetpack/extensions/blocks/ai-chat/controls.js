import { BaseControl, PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function AiChatControls( { setAttributes, askButtonLabel } ) {
	return (
		<PanelBody title={ __( 'Settings', 'jetpack' ) } initialOpen={ false }>
			<BaseControl
				label={ __( 'Ask button', 'jetpack' ) }
				help={ __( 'What do you want the button to say?', 'jetpack' ) }
				className="jetpack-ai-chat__ask-button-text"
			>
				<TextControl
					placeholder={ __( 'Ask', 'jetpack' ) }
					onChange={ newAskButtonLabel => setAttributes( { askButtonLabel: newAskButtonLabel } ) }
					value={ askButtonLabel }
				/>
			</BaseControl>
		</PanelBody>
	);
}
