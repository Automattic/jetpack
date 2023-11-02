import { select, dispatch } from '@wordpress/data';
import { PluginBlockSettingsMenuItem } from '@wordpress/edit-post';
import { __ } from '@wordpress/i18n';
import { name } from '../index';
import { transformToCoreGroup } from './transform-to-core-group';

function replaceBlockAndKeepContent() {
	const block = select( 'core/block-editor' ).getSelectedBlock();
	dispatch( 'core/block-editor' ).replaceBlock(
		block.clientId,
		transformToCoreGroup( block.innerBlocks )
	);
}

/**
 * Register a Menu item for Removing the block and keeping the content.
 *
 * @returns {Element} Remove block and keep content menu item.
 */
export default () => (
	<PluginBlockSettingsMenuItem
		allowedBlocks={ [ name ] }
		label={ __( 'Remove block and keep content', 'jetpack' ) }
		onClick={ replaceBlockAndKeepContent }
	/>
);
