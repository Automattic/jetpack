import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Controls() {
	return (
		<InspectorControls>
			<PanelBody className="components-panel__body-gif-branding">
				<p className="gif-branding-text">
					<a href="https://www.tumblr.com" target="_blank" rel="noopener noreferrer">
						{ __( 'Powered by Tumblr', 'jetpack' ) }
					</a>
				</p>
			</PanelBody>
		</InspectorControls>
	);
}
