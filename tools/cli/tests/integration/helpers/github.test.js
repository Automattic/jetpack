import { doesRepoExist } from '../../../helpers/github.js';

/** @todo Fix these tests and un-skip them. They work locally, but not in CI. */
describe.skip( 'doesRepoExist Integration Tests', function () {
	test( 'checks for an existing mirror repo', async () => {
		await expect( doesRepoExist( 'jetpack' ) ).resolves.toBe( true );
	}, 60000 );
	test( 'checks for an non-existent repo', async () => {
		await expect( doesRepoExist( 'jetpack-zzz-test-not-exist' ) ).resolves.toBe( false );
	}, 60000 );
	test( 'checks for an existent private repo', async () => {
		await expect( doesRepoExist( 'jpop-issues' ) ).resolves.toBe( true );
	}, 60000 );
} );
