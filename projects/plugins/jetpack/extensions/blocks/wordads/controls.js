import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import FormatPicker from './format-picker';

export const AdVisibilityToggle = ( { value, onChange } ) => (
	<PanelBody title={ __( 'Visibility', 'jetpack' ) }>
		<ToggleControl
			className="jetpack-wordads__mobile-visibility"
			checked={ !! value }
			label={ __( 'Hide on mobile', 'jetpack' ) }
			help={ __( 'Hides this block for site visitors on mobile devices.', 'jetpack' ) }
			onChange={ onChange }
		/>
	</PanelBody>
);

const AdControls = ( { attributes: { format, hideMobile }, setAttributes } ) => {
	return (
		<>
			<BlockControls>
				<FormatPicker
					value={ format }
					onChange={ nextFormat => setAttributes( { format: nextFormat } ) }
				/>
			</BlockControls>
			<InspectorControls>
				<AdVisibilityToggle
					value={ hideMobile }
					onChange={ hide => setAttributes( { hideMobile: !! hide } ) }
				/>
			</InspectorControls>
		</>
	);
};

export default AdControls;
