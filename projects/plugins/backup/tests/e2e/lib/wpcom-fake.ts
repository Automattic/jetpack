import type { TestUtils } from '@automattic/_jetpack-e2e-commons/utils/index';

/** Mirrors the constants in `tools/e2e-commons/plugins/e2e-backup-test-helper.php`. */
export const REWIND_ID = '1760000000.25';
export const DOWNLOAD_URL = 'https://example.com/jetpack-backup-e2e/backup.zip';
export const FILE_URL = 'https://example.com/jetpack-backup-e2e/notes.txt';
export const FILE_CONTENT = 'Hello from the Jetpack Backup e2e fake.';

export type FakeRequests = Record<
	string,
	{ count: number; body: Record< string, unknown > | null } | undefined
>;

/**
 * Forget every request the helper answered, and answer capabilities with a 200 again.
 *
 * @param testUtils - e2e-commons test utilities.
 */
export async function resetFake( testUtils: TestUtils ) {
	await testUtils.executeWpCommand( [
		'option',
		'update',
		'e2e_backup_requests',
		'{}',
		'--format=json',
	] );
	await testUtils.executeWpCommand( [
		'option',
		'update',
		'e2e_backup_capabilities_status',
		'200',
	] );
}

/**
 * Set the rewind capabilities the helper answers with.
 *
 * @param testUtils    - e2e-commons test utilities.
 * @param capabilities - Comma-separated capability slugs, e.g. `backup,scan`.
 */
export async function setCapabilities( testUtils: TestUtils, capabilities: string ) {
	await testUtils.executeWpCommand( [
		'option',
		'update',
		'e2e_backup_capabilities',
		capabilities,
	] );
}

/**
 * Make the helper answer the capabilities request with a failure.
 *
 * @param testUtils - e2e-commons test utilities.
 */
export async function failCapabilities( testUtils: TestUtils ) {
	await testUtils.executeWpCommand( [
		'option',
		'update',
		'e2e_backup_capabilities_status',
		'500',
	] );
}

/**
 * Every request the helper answered, keyed by route, e.g. `POST rewind/restores`.
 *
 * @param testUtils - e2e-commons test utilities.
 * @return The count and last body per route.
 */
export async function getFakeRequests( testUtils: TestUtils ): Promise< FakeRequests > {
	const raw = await testUtils.executeWpCommand( [
		'option',
		'get',
		'e2e_backup_requests',
		'--format=json',
	] );
	return JSON.parse( raw.trim() ) as FakeRequests;
}
