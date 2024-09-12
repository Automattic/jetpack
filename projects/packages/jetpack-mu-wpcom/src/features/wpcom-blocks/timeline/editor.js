import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import childBlocks from './child-blocks';
import edit from './edit';
import example from './example';
import save from './save';
import './editor.scss';
import './style.scss';

registerBlockType( metadata.name, {
	...metadata,
	edit,
	save,
	example,
	icon: getBlockIconProp( metadata ),
	attributes: metadata.attributes || {},
} );

childBlocks.forEach( childBlock => {
	registerBlockType( childBlock.name, childBlock.settings );
} );
