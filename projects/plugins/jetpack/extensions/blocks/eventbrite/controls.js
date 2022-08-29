import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

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
