import { InspectorControls } from '@wordpress/block-editor';
import { ExternalLink, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

export default function Controls() {
	return (
		<InspectorControls>
			<PanelBody className="components-panel__body-gif-branding">
				<p className="gif-branding-text">
					<ExternalLink href="https://www.tumblr.com">
						{ __( 'Powered by Tumblr', 'jetpack' ) }
					</ExternalLink>
				</p>
			</PanelBody>
		</InspectorControls>
	);
}
