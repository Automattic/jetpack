import { AI_DISABLED_REASON, getDisabledGate } from '../get-disabled-gate';

describe( 'getDisabledGate', () => {
	it( 'returns null when the block is available', () => {
		expect( getDisabledGate( { available: true } ) ).toBeNull();
	} );

	it( 'returns null when the block is unavailable for another reason', () => {
		expect(
			getDisabledGate( { available: false, unavailableReason: 'missing_plan', details: {} } )
		).toBeNull();
		expect(
			getDisabledGate( { available: false, unavailableReason: 'missing_module', details: {} } )
		).toBeNull();
	} );

	it( 'returns the writing assistant gate when that setting is off', () => {
		expect(
			getDisabledGate( {
				available: false,
				unavailableReason: AI_DISABLED_REASON,
				details: { gate: 'writing_assistant' },
			} )
		).toBe( 'writing_assistant' );
	} );

	it( 'returns the master gate when Jetpack AI is off', () => {
		expect(
			getDisabledGate( {
				available: false,
				unavailableReason: AI_DISABLED_REASON,
				details: { gate: 'master' },
			} )
		).toBe( 'master' );
	} );

	it( 'falls back to the master gate when the server sends no gate', () => {
		expect(
			getDisabledGate( { available: false, unavailableReason: AI_DISABLED_REASON, details: {} } )
		).toBe( 'master' );
	} );
} );
