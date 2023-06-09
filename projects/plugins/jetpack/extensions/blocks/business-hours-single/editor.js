import { registerBlockType } from '@wordpress/blocks';
import metadata from './block.json';
import { settings } from '.';

registerBlockType( metadata, settings );
