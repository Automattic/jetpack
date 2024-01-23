import { InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function SubscriberLoginEdit( { attributes, setAttributes, className } ) {
	const { redirectToCurrent } = attributes;

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Settings', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Redirect to current URL', 'jetpack' ) }
						checked={ redirectToCurrent }
						onChange={ () => setAttributes( { redirectToCurrent: ! redirectToCurrent } ) }
					/>
				</PanelBody>
			</InspectorControls>
			<div className={ className }>
				<a href="#logout-pseudo-link">{ __( 'Log out', 'jetpack' ) }</a>
			</div>
		</>
	);
}

export default SubscriberLoginEdit;
