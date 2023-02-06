import { fileURLToPath } from 'url';
import { toBeObject } from 'jest-extended';
import { readComposerJson, readPackageJson } from '../../../helpers/json.js';

expect.extend( { toBeObject } );

const oldCwd = process.cwd();
beforeAll( () => process.chdir( fileURLToPath( new URL( '../../../../../', import.meta.url ) ) ) );
afterAll( () => process.chdir( oldCwd ) );

describe( 'readComposerJson', () => {
	test( 'should be a function', () => {
		expect( readComposerJson ).toBeInstanceOf( Function );
	} );
	test( 'plugins/jetpack should have data', () => {
		expect( readComposerJson( 'plugins/jetpack', false ) ).toBeObject();
	} );
} );

describe( 'readPackageJson', () => {
	test( 'should be a function', () => {
		expect( readPackageJson ).toBeInstanceOf( Function );
	} );
	test( 'plugins/jetpack should have data', () => {
		expect( readPackageJson( 'plugins/jetpack', false ) ).toBeObject();
	} );
	test( 'packages/abtest should not have data', () => {
		expect( readPackageJson( 'packages/abtest', false ) ).toBeUndefined();
	} );
} );
