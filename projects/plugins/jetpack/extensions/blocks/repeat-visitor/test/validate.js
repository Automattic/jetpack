import { RichText } from '@wordpress/block-editor';
import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import edit from '../components/edit';
import save from '../components/save';
import v1 from '../deprecated/v1/attributes';

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
const { name } = metadata;
const blocks = [
	{ name, settings: { ...metadata, edit, save, deprecated: [ v1 ] } },
	{ name: 'core/paragraph', settings: fakeParagraphBlockSettings },
];
runBlockFixtureTests( name, blocks, __dirname );
