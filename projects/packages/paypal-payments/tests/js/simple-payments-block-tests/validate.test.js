import metadata from '../../../src/block/block.json';
import deprecatedV1 from '../../../src/block/deprecated/v1/index.jsx';
import deprecatedV2 from '../../../src/block/deprecated/v2/index.jsx';
import edit from '../../../src/block/edit';
import save from '../../../src/block/save';
import runBlockFixtureTests from './block-fixtures';

const intlNumberFormatSpy = jest.spyOn( Intl, 'NumberFormat' );
beforeEach( () => {
	intlNumberFormatSpy
		.mockReset()
		.mockImplementation( () => ( { format: value => `A$${ value.toString() }.00` } ) );
} );

const { name } = metadata;
const blocks = [
	{
		name,
		settings: {
			...metadata,
			edit,
			save,

			deprecated: [ deprecatedV1, deprecatedV2 ],
		},
	},
];

runBlockFixtureTests( name, blocks, __dirname );
