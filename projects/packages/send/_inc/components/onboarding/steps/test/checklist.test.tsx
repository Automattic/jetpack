import { renderHook } from '@testing-library/react';
import { speak } from '@wordpress/a11y';
import { useAnnounceRecordChanges } from '../checklist';
import type { DnsLookup, DnsLookupRecord, DnsRecordState } from '../../../../data/types';

jest.mock( '@wordpress/a11y', () => ( { speak: jest.fn() } ) );

const row = ( purpose: DnsLookupRecord[ 'purpose' ], state: DnsRecordState ): DnsLookupRecord => ( {
	purpose,
	name: '',
	host: '',
	type: 'TXT',
	state,
	expected: '',
} );

const lookup = ( records: DnsLookupRecord[] ): DnsLookup => ( {
	domain: 'example.com',
	checked_at: '2026-10-18T10:00:00Z',
	records,
	all_found: false,
	can_enable: false,
} );

describe( 'useAnnounceRecordChanges', () => {
	beforeEach( () => jest.mocked( speak ).mockClear() );

	it( 'numbers rows like the cards, whatever order the server lists them in', () => {
		const { rerender } = renderHook( ( { value } ) => useAnnounceRecordChanges( value ), {
			initialProps: {
				value: lookup( [
					row( 'dkim', 'not_found' ),
					row( 'spf', 'not_found' ),
					row( 'lockdown', 'not_found' ),
				] ),
			},
		} );
		expect( speak ).not.toHaveBeenCalled();

		rerender( {
			value: lookup( [
				row( 'dkim', 'found' ),
				row( 'spf', 'found' ),
				row( 'lockdown', 'not_found' ),
			] ),
		} );

		// The signing record is card 2; the optional sender list has no card, so it isn't read out.
		expect( speak ).toHaveBeenCalledTimes( 1 );
		expect( speak ).toHaveBeenCalledWith( 'Record 2 found.' );
	} );

	it( 'says what is wrong with a record, not a catch-all', () => {
		const { rerender } = renderHook( ( { value } ) => useAnnounceRecordChanges( value ), {
			initialProps: { value: lookup( [ row( 'lockdown', 'not_found' ), row( 'dkim', 'found' ) ] ) },
		} );

		rerender( {
			value: lookup( [
				{ ...row( 'lockdown', 'needs_fix' ), problem: 'wrong_value' },
				row( 'dkim', 'found' ),
			] ),
		} );

		expect( speak ).toHaveBeenCalledWith( 'Record 1: Doesn’t match.' );
	} );
} );
