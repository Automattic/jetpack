import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';
import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/legacy-widget' ],
				isMatch: ( { idBase, instance } ) => {
					if ( ! instance?.raw ) {
						return false;
					}

					return idBase === 'blog-stats';
				},
				transform: ( { instance } ) => {
					const headingBlock = instance.raw.title
						? createBlock( 'core/heading', {
								content: instance.raw.title,
								level: 3,
						  } )
						: null;

					const blogStatsBlock = createBlock( 'jetpack/blog-stats', {
						label: instance.raw.hits,
					} );

					return ! headingBlock ? blogStatsBlock : [ headingBlock, blogStatsBlock ];
				},
			},
		],
	},
} );
