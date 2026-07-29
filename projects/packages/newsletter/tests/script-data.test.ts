const mockGetScriptData = jest.fn();

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getScriptData: () => mockGetScriptData(),
} ) );

import { getNewsletterModeScriptData, getNewsletterScriptData } from '../src/settings/script-data';

describe( 'newsletter script data helpers', () => {
	beforeEach( () => {
		mockGetScriptData.mockReset();
	} );

	it( 'returns the shared Newsletter settings payload', () => {
		const newsletter = { modeEnabled: true };
		mockGetScriptData.mockReturnValue( { newsletter } );

		expect( getNewsletterScriptData() ).toBe( newsletter );
	} );

	it( 'returns the mode-only payload from its own namespace', () => {
		const newsletterMode = { greetingName: 'Alex' };
		mockGetScriptData.mockReturnValue( { newsletter_mode: newsletterMode } );

		expect( getNewsletterModeScriptData() ).toBe( newsletterMode );
	} );

	it( 'returns undefined when the global script data is missing', () => {
		mockGetScriptData.mockReturnValue( undefined );

		expect( getNewsletterScriptData() ).toBeUndefined();
		expect( getNewsletterModeScriptData() ).toBeUndefined();
	} );
} );
