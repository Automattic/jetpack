/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { BlockControls } from '@wordpress/block-editor';

export default function PinterestControls( { setEditingState } ) {
	return (
		<BlockControls>
			<ToolbarGroup>
				<ToolbarButton
					className="components-toolbar__control"
					label={ __( 'Edit URL', 'jetpack' ) }
					icon="edit"
					onClick={ () => setEditingState( true ) }
				/>
			</ToolbarGroup>
		</BlockControls>
	);
}
