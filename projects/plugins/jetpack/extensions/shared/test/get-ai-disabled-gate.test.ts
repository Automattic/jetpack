import { AI_DISABLED_REASON, getAiDisabledGate } from '../get-ai-disabled-gate';

describe( 'getAiDisabledGate', () => {
	it( 'returns null when the block is available', () => {
		expect( getAiDisabledGate( { available: true } ) ).toBeNull();
	} );

	it( 'returns null when the block is unavailable for another reason', () => {
		expect(
			getAiDisabledGate( { available: false, unavailableReason: 'missing_plan', details: {} } )
		).toBeNull();
		expect(
			getAiDisabledGate( { available: false, unavailableReason: 'missing_module', details: {} } )
		).toBeNull();
	} );

	it( 'returns the writing assistant gate when that setting is off', () => {
		expect(
			getAiDisabledGate( {
				available: false,
				unavailableReason: AI_DISABLED_REASON,
				details: { gate: 'writing_assistant' },
			} )
		).toBe( 'writing_assistant' );
	} );

	it( 'returns the master gate when Jetpack AI is off', () => {
		expect(
			getAiDisabledGate( {
				available: false,
				unavailableReason: AI_DISABLED_REASON,
				details: { gate: 'master' },
			} )
		).toBe( 'master' );
	} );

	it( 'falls back to the master gate when the server sends no gate', () => {
		expect(
			getAiDisabledGate( { available: false, unavailableReason: AI_DISABLED_REASON, details: {} } )
		).toBe( 'master' );
	} );
} );
