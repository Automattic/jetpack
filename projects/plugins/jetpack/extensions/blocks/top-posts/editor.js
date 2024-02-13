import { createBlock } from '@wordpress/blocks';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => null,
	// Transform from classic widget
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/legacy-widget' ],
				isMatch: ( { idBase, instance } ) => {
					if ( ! instance?.raw ) {
						return false;
					}

					return idBase === 'top-posts';
				},
				transform: ( { instance } ) => {
					const headingBlock = instance.raw.title
						? createBlock( 'core/heading', {
								content: instance.raw.title,
								level: 3,
						  } )
						: null;

					const topPostsBlock = createBlock( 'jetpack/top-posts', {
						displayAuthor: false,
						displayDate: false,
						displayThumbnail: instance.raw.display !== 'text',
						layout: instance.raw.display === 'grid' ? 'grid' : 'list',
						period: '2',
						postsToShow: instance.raw.count,
						postTypes: instance.raw.types.reduce( ( typesObject, typesItem ) => {
							typesObject[ typesItem ] = true;
							return typesObject;
						}, {} ),
					} );

					if ( ! headingBlock ) {
						return topPostsBlock;
					}

					return [ headingBlock, topPostsBlock ];
				},
			},
		],
	},
} );
