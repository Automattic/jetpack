import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
	ALL_ITEMS,
	findResumableDownload,
	hasSelectedItems,
	pickLastBackup,
	readCreatedDownload,
	readDownload,
} from './download.ts';

describe( 'pickLastBackup', () => {
	it( 'passes over a newer backup that did not finish', () => {
		const backup = pickLastBackup( {
			backups: [
				{ is_rewindable: false, object: { backup_period: 1760000000 } },
				{ is_rewindable: true, object: { backup_period: 1759900000 } },
			],
		} );

		assert.deepEqual( backup, { rewindId: '1759900000', takenAt: 1759900000000 } );
	} );

	it( 'keeps a fractional rewind ID exactly as sent', () => {
		const backup = pickLastBackup( {
			backups: [ { is_rewindable: true, object: { backup_period: '1759900000.123' } } ],
		} );

		assert.equal( backup?.rewindId, '1759900000.123' );
	} );

	for ( const [ name, response ] of [
		[ 'an empty list', { backups: [] } ],
		[ 'a body without a list', [] ],
		[ 'a backup without a period', { backups: [ { is_rewindable: true, object: {} } ] } ],
		[ 'no body', null ],
	] as const ) {
		it( `offers nothing for ${ name }`, () => {
			assert.equal( pickLastBackup( response ), null );
		} );
	}
} );

describe( 'readDownload', () => {
	for ( const [ name, raw, expected ] of [
		[
			'an error over a stale link',
			{ downloadId: 7, url: 'https://example.com/old.zip', error: 'Ran out of space' },
			{ status: 'failed', id: 7, error: 'Ran out of space' },
		],
		[
			'a link that is not a web URL',
			{ downloadId: 7, url: 'javascript:alert(1)' },
			{ status: 'failed', id: 7, error: '' },
		],
		[
			'a finished download whose link was withdrawn',
			{ downloadId: 7, validUntil: '2026-10-01T00:00:00+00:00' },
			{ status: 'expired', id: 7 },
		],
		[
			'a finished download',
			{ downloadId: 7, url: 'https://example.com/a.zip', bytesFormatted: '1.2 GB' },
			{ status: 'finished', id: 7, url: 'https://example.com/a.zip', size: '1.2 GB' },
		],
		[
			'a download not yet reporting progress',
			{ downloadId: 7 },
			{ status: 'running', id: 7, progress: 0 },
		],
		[
			'progress past the end',
			{ downloadId: 7, progress: 140 },
			{ status: 'running', id: 7, progress: 100 },
		],
	] as const ) {
		it( `reads ${ name }`, () => {
			assert.deepEqual( readDownload( raw ), expected );
		} );
	}

	it( 'reads nothing without a download ID', () => {
		assert.equal( readDownload( { progress: 50 } ), null );
	} );
} );

describe( 'findResumableDownload', () => {
	it( 'resumes the newest download of the backup on offer', () => {
		const download = findResumableDownload(
			[
				{ downloadId: 3, rewindId: '100', url: 'https://example.com/old.zip' },
				{ downloadId: 5, rewindId: '100', progress: 40 },
				{ downloadId: 9, rewindId: '200', progress: 10 },
			],
			'100'
		);

		assert.deepEqual( download, { status: 'running', id: 5, progress: 40 } );
	} );

	it( 'does not fall back to an older download when the newest one failed', () => {
		const download = findResumableDownload(
			[
				{ downloadId: 3, rewindId: '100', url: 'https://example.com/old.zip' },
				{ downloadId: 5, rewindId: '100', error: 'Failed' },
			],
			'100'
		);

		assert.equal( download, null );
	} );
} );

describe( 'readCreatedDownload', () => {
	for ( const [ name, response, expected ] of [
		[ 'its own job', { downloadId: 7, rewindId: '100' }, 7 ],
		[ 'a running job of another backup as busy', { downloadId: 7, rewindId: '90' }, 'busy' ],
		[ 'a rewind ID echoed as a number', { downloadId: 7, rewindId: 100 }, 7 ],
		[ 'a reply that does not echo the rewind ID', { downloadId: 7 }, 7 ],
		[ 'nothing without a download ID', { rewindId: '100' }, null ],
	] as const ) {
		it( `reads ${ name }`, () => {
			assert.equal( readCreatedDownload( response, '100' ), expected );
		} );
	}
} );

describe( 'hasSelectedItems', () => {
	it( 'holds back an empty checklist, which the API would read as everything', () => {
		const none = Object.fromEntries(
			Object.keys( ALL_ITEMS ).map( key => [ key, false ] )
		) as typeof ALL_ITEMS;

		assert.equal( hasSelectedItems( none ), false );
		assert.equal( hasSelectedItems( { ...none, sqls: true } ), true );
	} );
} );
