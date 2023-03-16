import { useBlockProps } from '@wordpress/block-editor';
import { pasteHandler } from '@wordpress/blocks';
import { RawHTML } from '@wordpress/element';

export default {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'div',
		},
		animationDone: {
			type: 'boolean',
			default: false,
		},
	},
	save: ( { attributes: { content } } ) => {
		const blockProps = useBlockProps.save();
		return <RawHTML { ...blockProps }>{ content }</RawHTML>;
	},
	migrate: ( { content } ) => {
		const parsedBlocks = pasteHandler( {
			HTML: '',
			mode: 'BLOCKS',
			plainText: content,
		} );
		return [
			{
				state: 'done',
			},
			parsedBlocks,
		];
	},
};
