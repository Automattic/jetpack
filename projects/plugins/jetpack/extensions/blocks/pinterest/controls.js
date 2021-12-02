/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';

export function PinterestBlockControls( { setEditingState } ) {
	return (
		<ToolbarGroup>
			<ToolbarButton
				className="components-toolbar__control"
				label={ __( 'Edit URL', 'jetpack' ) }
				icon="edit"
				onClick={ () => setEditingState( true ) }
			/>
		</ToolbarGroup>
	);
}
