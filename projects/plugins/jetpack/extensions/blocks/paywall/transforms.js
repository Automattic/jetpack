import { createBlock } from '@wordpress/blocks';
import metadata from './block.json';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/more', 'core/nextpage' ],
			transform: () => createBlock( metadata.name ),
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/more' ],
			transform: () => createBlock( 'core/more' ),
		},
		{
			type: 'block',
			blocks: [ 'core/nextpage' ],
			transform: () => createBlock( 'core/nextpage' ),
		},
	],
};

export default transforms;
