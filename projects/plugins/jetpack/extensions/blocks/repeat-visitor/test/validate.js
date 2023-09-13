import { RichText } from '@wordpress/block-editor';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';

// To test that this block can contain arbitrary blocks, register a
// fake paragraph block so that core paragraph block markup can appear
// in innerBlocks within the block under test, with the generated fixtures
// preserving the markup in the parsed JSON and serialized HTML.
const fakeParagraphBlockSettings = {
	attributes: {
		content: {
			type: 'string',
			source: 'html',
			selector: 'p',
			default: '',
			__experimentalRole: 'content',
		},
	},
	edit() {},
	save( { attributes } ) {
		const { content } = attributes;
		return (
			<p>
				<RichText.Content value={ content } />
			</p>
		);
	},
	supports: {
		className: false,
	},
	title: 'Fake paragraph block',
};

const { name } = metadata;
const blocks = [
	{ name, settings: metadata },
	{ name: 'core/paragraph', settings: fakeParagraphBlockSettings },
];

runBlockFixtureTests( name, blocks, __dirname );
