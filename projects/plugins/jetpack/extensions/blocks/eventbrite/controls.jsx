import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import BlockStylesSelector from '../../shared/components/block-styles-selector';

const embedTypes = [
	{
		value: 'inline',
		label: __( 'In-page Embed', 'jetpack' ),
	},
	{
		value: 'modal',
		label: __( 'Button & Modal', 'jetpack' ),
	},
];

export const ToolbarControls = ( { setEditingUrl } ) => (
	<ToolbarGroup>
		<ToolbarButton
			className="components-toolbar__control"
			label={ __( 'Edit URL', 'jetpack' ) }
			icon="edit"
			onClick={ () => setEditingUrl( true ) }
		/>
	</ToolbarGroup>
);

export const InspectorControls = ( { attributes, setAttributes } ) => (
	<BlockStylesSelector
		title={ _x(
			'Embed Type',
			'option for how the embed displays on a page, e.g. inline or as a modal',
			'jetpack'
		) }
		styleOptions={ embedTypes }
		onSelectStyle={ setAttributes }
		activeStyle={ attributes.style }
	/>
);
