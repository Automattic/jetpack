import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { getScan, setScan } from '../store';
import { ThreatFileViewer, openThreatFile } from '../threat-file';
import type { ScanThreat } from '../types';

jest.mock( '@wordpress/api-fetch', () => ( { __esModule: true, default: jest.fn() } ) );
jest.mock( '@wordpress/route', () => ( {
	useSearch: jest.fn( () => ( {} ) ),
	useNavigate: () => jest.fn(),
} ) );

const threat = {
	id: 7,
	title: 'Malicious code found in file: photo.jpg.php',
	filename: '/htdocs/wp-content/uploads/photo.jpg.php',
};
const sibling = { id: 8, title: 'Backdoor found', filename: threat.filename };
const ignoredSibling = { id: 9, title: 'Web shell found', filename: threat.filename };
const other = { id: 10, title: 'Malicious code found in file: loose.php', filename: '/loose.php' };

const shownFile = {
	path: 'wp-content/uploads/photo.jpg.php',
	modified: null,
	owner: { type: 'none' },
	inUploads: true,
	canDelete: true,
	canRestore: false,
	loaded: false,
	contents: '<?php echo 1;',
	hash: 'abc',
};

window.jetpackProtectDashboard = {
	scan: { hasPlan: true, url: '#', error: false, threats: [], ignored: [] },
};

/**
 * Open the viewer on a file, answering the file request and any delete.
 *
 * @param shown   - The threat to open.
 * @param file    - What the file request returns.
 * @param deleted - What the delete request returns.
 */
async function openFile(
	shown: ScanThreat,
	file: Record< string, unknown > = {},
	deleted: object = {}
) {
	( apiFetch as unknown as jest.Mock )
		.mockClear()
		.mockImplementation( ( { method } ) =>
			Promise.resolve( method === 'POST' ? deleted : { ...shownFile, ...file } )
		);
	render( <ThreatFileViewer /> );
	act( () => openThreatFile( shown ) );
	await expect( screen.findByText( shownFile.path ) ).resolves.toBeInTheDocument();
}

describe( 'Deleting a threat file', () => {
	it.each( [
		[
			'the threat',
			[ threat, other ],
			[],
			[],
			'',
			'Deleted photo.jpg.php and marked the threat fixed.',
		],
		[
			'the threat and the other found in the file',
			[ threat, sibling, other ],
			[],
			[ 8 ],
			' The other threat in this file is marked fixed too.',
			'Deleted photo.jpg.php and marked 2 threats fixed.',
		],
		[
			'the threat and the open and ignored others found in the file',
			[ threat, sibling, other ],
			[ sibling, ignoredSibling ],
			[ 8, 9 ],
			' The 2 other threats in this file are marked fixed too.',
			'Deleted photo.jpg.php and marked 3 threats fixed.',
		],
	] )( 'fixes %s', async ( _name, threats, ignored, others, alsoFixed, notice ) => {
		setScan( current => ( { ...current, threats, ignored } ) );
		await openFile( threat, {}, { threat, others } );

		await userEvent.click( screen.getByRole( 'button', { name: 'Delete file' } ) );
		expect(
			screen.getByText(
				`${ shownFile.path } doesn’t belong to WordPress, a plugin or a theme, and Jetpack didn’t find WordPress using it. Deleting it can’t be undone.${ alsoFixed }`
			)
		).toBeInTheDocument();
		const confirm = screen.getAllByRole( 'button', { name: 'Delete file' } ).pop();
		await userEvent.click( confirm as HTMLElement );

		await waitFor( () => expect( getScan()?.threats ).toEqual( [ other ] ) );
		expect( apiFetch ).toHaveBeenCalledWith( expect.objectContaining( { data: { hash: 'abc' } } ) );
		expect( getScan()?.ignored ).toEqual( [] );
		expect( select( noticesStore ).getNotices() ).toContainEqual(
			expect.objectContaining( { content: notice } )
		);
	} );
} );

describe( 'Restoring a threat file', () => {
	it( 'stays open on the fixed threat and reloads the file, without its actions', async () => {
		setScan( current => ( { ...current, threats: [ threat ], ignored: [] } ) );
		await openFile(
			threat,
			{
				canDelete: false,
				canRestore: true,
				owner: { type: 'core', version: '6.8', modified: true },
			},
			{ threat: { ...threat, status: 'fixed' }, others: [] }
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Restore original' } ) );
		const confirm = screen.getAllByRole( 'button', { name: 'Restore original' } ).pop();
		await userEvent.click( confirm as HTMLElement );

		await waitFor( () =>
			expect( screen.queryByRole( 'button', { name: 'Restore original' } ) ).not.toBeInTheDocument()
		);
		expect( screen.getByText( shownFile.path ) ).toBeInTheDocument();
		expect(
			( apiFetch as unknown as jest.Mock ).mock.calls.filter( ( [ { path } ] ) =>
				path.endsWith( '/file' )
			)
		).toHaveLength( 2 );
		expect( select( noticesStore ).getNotices() ).toContainEqual(
			expect.objectContaining( {
				content: 'Restored the original photo.jpg.php and marked the threat fixed.',
			} )
		);
	} );
} );

describe( 'The threat file viewer', () => {
	const loadedNote = /Your site loads this file, so it can’t be deleted here\./;

	it.each( [
		[ 'says why Delete is missing when the site loads the file', true ],
		[ 'says nothing about loading otherwise', false ],
	] )( '%s', async ( _name, loaded ) => {
		await openFile( threat, { loaded, canDelete: ! loaded } );

		expect( screen.queryByText( loadedNote ) !== null ).toBe( loaded );
	} );

	it.each( [
		[ 'open', true ],
		[ 'fixed', false ],
	] )( 'says the flagged code is gone from a file of a %s threat: %s', async ( status, shown ) => {
		await openFile( {
			...threat,
			status,
			context: [ { line: 1, code: 'eval( $x );' } ],
		} as ScanThreat );

		expect( screen.queryByText( /The flagged code isn’t in this file anymore\./ ) !== null ).toBe(
			shown
		);
	} );
} );
