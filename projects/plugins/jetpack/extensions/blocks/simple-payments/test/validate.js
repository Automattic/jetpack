import runBlockFixtureTests from '../../../shared/test/block-fixtures';
import metadata from '../block.json';

const intlNumberFormatSpy = jest.spyOn( Intl, 'NumberFormat' );

beforeEach( () => {
	intlNumberFormatSpy
		.mockReset()
		.mockImplementation( () => ( { format: value => `A$${ value.toString() }.00` } ) );
} );
const { name } = metadata;
const blocks = [ { name, settings: metadata } ];

runBlockFixtureTests( name, blocks, __dirname );
