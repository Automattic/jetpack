import { isFixComplete } from '../use-fix-threats-status';
import type { FixThreatsStatusResponse } from '../types';

describe( 'isFixComplete', () => {
	it( 'returns false when the response is undefined (no poll yet)', () => {
		expect( isFixComplete( undefined ) ).toBe( false );
	} );

	it( 'returns true when the threat map is empty (nothing to fix)', () => {
		const response: FixThreatsStatusResponse = { ok: true, threats: {} };
		expect( isFixComplete( response ) ).toBe( true );
	} );

	it( 'returns false while any threat is still in_progress', () => {
		const response: FixThreatsStatusResponse = {
			ok: true,
			threats: {
				a: { status: 'fixed' },
				b: { status: 'in_progress' },
			},
		};
		expect( isFixComplete( response ) ).toBe( false );
	} );

	it( 'returns true when every threat has reached a terminal status', () => {
		const response: FixThreatsStatusResponse = {
			ok: true,
			threats: {
				a: { status: 'fixed' },
				b: { status: 'not_fixed' },
				c: { status: 'not_found' },
			},
		};
		expect( isFixComplete( response ) ).toBe( true );
	} );

	it( 'tolerates an unexpected status string and treats it as non-terminal', () => {
		const response: FixThreatsStatusResponse = {
			ok: true,
			threats: {
				a: { status: 'fixed' },
				b: { status: 'queued_unknown' },
			},
		};
		expect( isFixComplete( response ) ).toBe( false );
	} );
} );
