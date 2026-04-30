import { InspectorControls, PanelColorSettings } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

const StyleControls = ( { attributes, setAttributes } ) => {
	const {
		activeTabBackgroundColor,
		activeTabTextColor,
		inactiveTabBackgroundColor,
		inactiveTabTextColor,
		selectedAmountBackgroundColor,
		selectedAmountTextColor,
	} = attributes;

	return (
		<InspectorControls group="styles">
			<PanelColorSettings
				title={ __( 'Tabs', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: activeTabBackgroundColor,
						onChange: value => setAttributes( { activeTabBackgroundColor: value } ),
						label: __( 'Active tab background', 'jetpack' ),
					},
					{
						value: activeTabTextColor,
						onChange: value => setAttributes( { activeTabTextColor: value } ),
						label: __( 'Active tab text', 'jetpack' ),
					},
					{
						value: inactiveTabBackgroundColor,
						onChange: value => setAttributes( { inactiveTabBackgroundColor: value } ),
						label: __( 'Inactive tab background', 'jetpack' ),
					},
					{
						value: inactiveTabTextColor,
						onChange: value => setAttributes( { inactiveTabTextColor: value } ),
						label: __( 'Inactive tab text', 'jetpack' ),
					},
				] }
			/>
			<PanelColorSettings
				title={ __( 'Selected amount', 'jetpack' ) }
				initialOpen={ false }
				colorSettings={ [
					{
						value: selectedAmountBackgroundColor,
						onChange: value => setAttributes( { selectedAmountBackgroundColor: value } ),
						label: __( 'Background', 'jetpack' ),
					},
					{
						value: selectedAmountTextColor,
						onChange: value => setAttributes( { selectedAmountTextColor: value } ),
						label: __( 'Text', 'jetpack' ),
					},
				] }
			/>
		</InspectorControls>
	);
};

export default StyleControls;
