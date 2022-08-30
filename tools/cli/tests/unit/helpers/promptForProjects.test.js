import { fileURLToPath } from 'url';
import promptForProject, { promptForType } from '../../../helpers/promptForProject.js';

const oldCwd = process.cwd();
beforeAll( () => process.chdir( fileURLToPath( new URL( '../../../../../', import.meta.url ) ) ) );
afterAll( () => process.chdir( oldCwd ) );

describe( 'promptForProject', () => {
	test( 'should be a function', () => {
		expect( promptForProject ).toBeInstanceOf( Function );
	} );
	test( 'should fail when an invalid project is passed', async () => {
		await expect( promptForProject( { project: 'test' } ) ).rejects.toThrow();
	} );

	test( 'should passthrough when type is passed', async () => {
		await expect( promptForProject( { project: 'plugins/jetpack' } ) ).resolves.toEqual( {
			project: 'plugins/jetpack',
		} );
	} );
} );

describe( 'promptForType', () => {
	test( 'should be a function', () => {
		expect( promptForType ).toBeInstanceOf( Function );
	} );

	test( 'should fail when an invalid type is passed', async () => {
		await expect( promptForType( { type: 'test' } ) ).rejects.toThrow();
	} );

	test( 'should passthrough when valid type is passed', async () => {
		await expect( promptForType( { type: 'plugins' } ) ).resolves.toEqual( { type: 'plugins' } );
	} );
} );
