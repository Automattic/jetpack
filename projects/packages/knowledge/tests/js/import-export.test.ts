import { jest } from '@jest/globals';

const saveGuidelineRow = jest.fn< ( ...args: unknown[] ) => Promise< void > >().mockResolvedValue();
const deleteGuidelineRow = jest
	.fn< ( ...args: unknown[] ) => Promise< void > >()
	.mockResolvedValue();
const downloadBlob = jest.fn();
const createSuccessNotice = jest.fn();

jest.unstable_mockModule( '@wordpress/notices', () => ( { store: 'notices' } ) );
jest.unstable_mockModule( '@wordpress/blob', () => ( { downloadBlob } ) );
jest.unstable_mockModule( '@wordpress/data', () => ( {
	dispatch: () => ( { createSuccessNotice } ),
} ) );
jest.unstable_mockModule( '../../routes/guidelines/data', () => ( {
	scopeSlug: ( scope: string ) => `guideline-${ scope }`,
	blockSlug: ( name: string ) => `guideline-block-${ name.replace( '/', '_' ) }`,
	saveGuidelineRow,
	deleteGuidelineRow,
	BLOCKS_SCOPE: 'blocks',
} ) );

const { exportGuidelines, importGuidelines } =
	await import( '../../routes/guidelines/import-export' );
const scopes = [
	{ slug: 'copy', title: 'Copy', description: '', order: 20 },
	{ slug: 'blocks', title: 'Blocks', description: '', order: 40 },
];
const blocks = [ { name: 'core/paragraph', title: 'Paragraph' } ];
const query = { slug: [], status: [ 'publish' ], per_page: 100 };

beforeEach( () => jest.clearAllMocks() );

test( 'exports the existing file format using only guideline rows', () => {
	exportGuidelines(
		scopes,
		{
			'guideline-copy': { id: 1, content: 'Plain language.' },
			'guideline-block-core_paragraph': { id: 2, content: 'Short paragraphs.' },
			'unrelated-note': { id: 3, content: 'Private note.' },
		},
		blocks
	);
	const [ filename, json ] = downloadBlob.mock.calls[ 0 ];
	expect( filename ).toMatch( /^guidelines-\d{4}-\d{2}-\d{2}\.json$/ );
	expect( JSON.parse( json as string ) ).toEqual( {
		guideline_categories: {
			copy: { guidelines: 'Plain language.' },
			blocks: { 'core/paragraph': { guidelines: 'Short paragraphs.' } },
		},
	} );
} );

test( 'imports into existing row IDs and ignores invalid block names', async () => {
	const file = {
		text: async () =>
			JSON.stringify( {
				guideline_categories: {
					copy: { guidelines: 'Updated copy.' },
					blocks: {
						'core/paragraph': { guidelines: 'Updated block.' },
						'invalid-name': { guidelines: 'Ignore me.' },
					},
				},
			} ),
	} as File;
	await importGuidelines(
		file,
		scopes,
		{
			'guideline-copy': { id: 1, content: 'Old copy.' },
			'guideline-block-core_paragraph': { id: 2, content: 'Old block.' },
		},
		blocks,
		query
	);
	expect( saveGuidelineRow ).toHaveBeenCalledTimes( 2 );
	expect( saveGuidelineRow ).toHaveBeenCalledWith(
		'guideline-copy',
		'Copy',
		'Updated copy.',
		1,
		query
	);
	expect( saveGuidelineRow ).toHaveBeenCalledWith(
		'guideline-block-core_paragraph',
		'core/paragraph',
		'Updated block.',
		2,
		query
	);
} );

test.each( [ '{}', '[]', '{"guideline_categories":[]}' ] )(
	'rejects invalid file %s before changing any records',
	async json => {
		await expect(
			importGuidelines(
				{ text: async () => json } as File,
				scopes,
				{
					'guideline-copy': { id: 1, content: 'Keep copy.' },
					'guideline-block-core_paragraph': { id: 2, content: 'Keep block.' },
				},
				blocks,
				query
			)
		).rejects.toThrow();
		expect( saveGuidelineRow ).not.toHaveBeenCalled();
		expect( deleteGuidelineRow ).not.toHaveBeenCalled();
	}
);

test( 'clears only current guideline rows omitted by an import', async () => {
	await importGuidelines(
		{ text: async () => '{"guideline_categories":{}}' } as File,
		scopes,
		{
			'guideline-copy': { id: 1, content: 'Copy.' },
			'guideline-block-core_paragraph': { id: 2, content: 'Block.' },
			'unrelated-note': { id: 3, content: 'Keep me.' },
		},
		blocks,
		query
	);
	expect( deleteGuidelineRow.mock.calls ).toEqual( [ [ 1 ], [ 2 ] ] );
} );
