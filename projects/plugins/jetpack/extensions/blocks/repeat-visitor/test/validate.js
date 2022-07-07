import { RichText } from '@wordpress/block-editor';
import { name, settings } from '../';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';

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

// Register the block under test, and a fake core paragraph block
// to avoid having to register all core blocks.
const blocks = [
	{ name: `jetpack/${ name }`, settings },
	{ name: 'core/paragraph', settings: fakeParagraphBlockSettings },
];
runBlockFixtureTests( `jetpack/${ name }`, blocks, __dirname );
