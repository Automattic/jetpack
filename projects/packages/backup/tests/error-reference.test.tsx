import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { speak } from '@wordpress/a11y';
import ErrorReference, { formatReference } from '../src/dashboard/components/error-reference';
import QueryError from '../src/dashboard/components/query-error';
import type { FailureReference } from '../src/dashboard/types/failure-reference';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

describe( 'formatReference', () => {
	it.each< [ string, FailureReference, string ] >( [
		[
			'a code and a restore',
			{ code: 'rewind_error', id: { kind: 'restore', value: 7 } },
			'Error code: rewind_error · Restore ID: 7',
		],
		[ 'a download', { code: null, id: { kind: 'download', value: 4321 } }, 'Download ID: 4321' ],
		[ 'a backup', { code: null, id: { kind: 'backup', value: '1.5' } }, 'Backup ID: 1.5' ],
		[ 'an attempt', { code: null, id: { kind: 'attempt', value: '9' } }, 'Backup attempt ID: 9' ],
		[ 'a code alone', { code: 'invalid_json', id: null }, 'Error code: invalid_json' ],
		[ 'nothing', { code: null, id: null }, '' ],
	] )( 'labels %s', ( _label, reference, expected ) => {
		expect( formatReference( reference ) ).toBe( expected );
	} );
} );

it( 'renders nothing, not an empty line with a copy button, when there is nothing to quote', () => {
	const { container } = render( <ErrorReference code={ null } id={ null } /> );
	expect( container ).toBeEmptyDOMElement();
} );

it( 'leaves no empty description in QueryError when there is nothing to quote', () => {
	const { container } = render(
		<QueryError title="We couldn't load this." error={ new Error( 'Not an ApiError' ) } />
	);
	// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access -- an empty box has no role or text to query by.
	expect( container.querySelector( '.jpb-query-error div:empty' ) ).toBeNull();
} );

it( 'copies exactly the line it shows, and announces it', async () => {
	// `setup()` stands in a clipboard, which jsdom lacks.
	const user = userEvent.setup();
	render( <ErrorReference code="rewind_error" id={ { kind: 'restore', value: 7 } } /> );

	await user.click( screen.getByRole( 'button', { name: 'Copy error reference' } ) );

	await waitFor( () => expect( speak ).toHaveBeenCalledWith( 'Copied' ) );
	await expect( navigator.clipboard.readText() ).resolves.toBe(
		'Error code: rewind_error · Restore ID: 7'
	);
} );
