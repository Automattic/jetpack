import { getBlockIconProp } from '@automattic/jetpack-shared-extension-utils';
import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import './editor.scss';

registerBlockType( metadata.name, {
	...metadata,
	edit,
	save,
	icon: getBlockIconProp( metadata ),
	attributes: metadata.attributes || {},
} );
