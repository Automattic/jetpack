import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';
import deprecatedV1 from '../deprecated/v1';
import deprecatedV2 from '../deprecated/v2';
import edit from '../edit';
import save from '../save';

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
