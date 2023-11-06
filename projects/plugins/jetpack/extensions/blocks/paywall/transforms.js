import { createBlock } from '@wordpress/blocks';
import { name } from './';

const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/more', 'core/nextpage' ],
			transform: () => createBlock( `jetpack/${ name }` ),
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
