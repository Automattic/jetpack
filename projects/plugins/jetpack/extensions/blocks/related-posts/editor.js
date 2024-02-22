import { InnerBlocks, useBlockProps } from '@wordpress/block-editor';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import { default as deprecated } from './deprecated';
import edit from './edit';

import './style.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: () => {
		const blockProps = useBlockProps.save();

		return (
			<div { ...blockProps }>
				<InnerBlocks.Content />
			</div>
		);
	},
	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'jetpack-related-posts',
			},
		],
	},
	deprecated,
} );
