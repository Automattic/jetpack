import { render } from '@testing-library/react';
import ErrorReference, { formatReference } from '../src/dashboard/components/error-reference';
import type { FailureReference } from '../src/dashboard/types/failure-reference';

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
