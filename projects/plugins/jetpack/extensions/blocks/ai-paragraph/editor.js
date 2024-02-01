import { useBlockProps } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';
import { registerJetpackBlockFromMetadata } from '../../shared/register-jetpack-block';
import metadata from './block.json';
import edit from './edit';

import './editor.scss';

registerJetpackBlockFromMetadata( metadata, {
	edit,
	save: attrs => {
		const blockProps = useBlockProps.save();
		return <RawHTML { ...blockProps }>{ attrs.attributes.content }</RawHTML>;
	},
	transforms: {
		to: [
			{
				type: 'block',
				blocks: [ 'core/paragraph' ],
				transform: ( { content } ) => {
					return createBlock( 'core/paragraph', {
						content,
					} );
				},
			},
		],
	},
} );
