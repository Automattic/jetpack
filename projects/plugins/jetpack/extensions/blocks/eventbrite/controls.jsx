import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __, _x } from '@wordpress/i18n';
import BlockStylesSelector from '../../shared/components/block-styles-selector';
import EventbriteInPageExample from './eventbrite-in-page-example.png';

const embedTypes = [
	{
		value: 'inline',
		label: __( 'In-page Embed', 'jetpack' ),
		preview: (
			<div className="block-editor-block-preview__container">
				<img
					src={ EventbriteInPageExample }
					alt={ __( 'In page Eventbrite checkout example', 'jetpack' ) }
				/>
			</div>
		),
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

export const InspectorControls = ( { attributes, clientId, setAttributes } ) => (
	<BlockStylesSelector
		title={ _x(
			'Embed Type',
			'option for how the embed displays on a page, e.g. inline or as a modal',
			'jetpack'
		) }
		clientId={ clientId }
		styleOptions={ embedTypes }
		onSelectStyle={ setAttributes }
		activeStyle={ attributes.style }
		attributes={ attributes }
		viewportWidth={ 130 }
	/>
);
