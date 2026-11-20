import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, RadioControl, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

import './style.scss';

export default function BlockStylesSelector( {
	styleOptions,
	onSelectStyle,
	activeStyle,
	title,
	children,
} ) {
	const panelTitle = title ? title : __( 'Styles', 'jetpack' );

	return (
		<>
			<BlockControls>
				<ToolbarGroup
					isCollapsed={ true }
					icon="admin-appearance"
					label={ __( 'Style', 'jetpack' ) }
					controls={ styleOptions.map( styleOption => ( {
						title: styleOption.label,
						isActive: styleOption.value === activeStyle,
						onClick: () => onSelectStyle( { style: styleOption.value } ),
					} ) ) }
					popoverProps={ { className: 'jetpack-block-styles-selector-toolbar' } }
				/>
			</BlockControls>
			<InspectorControls>
				<PanelBody title={ panelTitle }>
					<RadioControl
						hideLabelFromVision
						label={ panelTitle }
						selected={ activeStyle }
						options={ styleOptions }
						onChange={ style => onSelectStyle( { style } ) }
					/>
					{ children }
				</PanelBody>
			</InspectorControls>
		</>
	);
}
