import { BaseControl, PanelBody, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export function PanelControls( { setAttributes, postLinkText } ) {
	return (
		<PanelBody title={ __( 'Settings', 'jetpack' ) } initialOpen={ false }>
			<BaseControl
				label={ __( 'Purchase link text', 'jetpack' ) }
				help={ __(
					'Enter the text you want to display on a purchase link used as fallback when the PayPal button cannot be used (e.g. emails, AMP, etc.)',
					'jetpack'
				) }
				className="jetpack-simple-payments__purchase-link-text"
			>
				<TextControl
					placeholder={ __( 'Click here to purchase', 'jetpack' ) }
					onChange={ newPostLinkText => setAttributes( { postLinkText: newPostLinkText } ) }
					value={ postLinkText }
				/>
			</BaseControl>
		</PanelBody>
	);
}
