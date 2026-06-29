import { isCollectingResponses } from '../is-collecting-responses';

describe( 'isCollectingResponses', () => {
	it( 'treats default attributes (email + saving on) as collecting', () => {
		expect( isCollectingResponses( {} ) ).toBe( true );
		expect( isCollectingResponses( { emailNotifications: true, saveResponses: true } ) ).toBe(
			true
		);
	} );

	it( 'flags a form with email off, saving off and no integrations', () => {
		expect( isCollectingResponses( { emailNotifications: false, saveResponses: false } ) ).toBe(
			false
		);
	} );

	it( 'is collecting when only saving is on', () => {
		expect( isCollectingResponses( { emailNotifications: false, saveResponses: true } ) ).toBe(
			true
		);
	} );

	it( 'is collecting when only email is on with a recipient', () => {
		expect(
			isCollectingResponses( {
				emailNotifications: true,
				to: 'admin@example.com',
				saveResponses: false,
			} )
		).toBe( true );
	} );

	it( 'is collecting when email is on even with an empty recipient (admin email fallback)', () => {
		expect(
			isCollectingResponses( { emailNotifications: true, to: '  ', saveResponses: false } )
		).toBe( true );
	} );

	it( 'handles yes/no string toggles', () => {
		expect( isCollectingResponses( { emailNotifications: 'no', saveResponses: 'no' } ) ).toBe(
			false
		);
		expect( isCollectingResponses( { emailNotifications: 'no', saveResponses: 'yes' } ) ).toBe(
			true
		);
	} );

	it( 'is collecting when a data integration is active', () => {
		const base = { emailNotifications: false, saveResponses: false };
		expect( isCollectingResponses( { ...base, jetpackCRM: true } ) ).toBe( true );
		expect( isCollectingResponses( { ...base, mailpoet: { enabledForForm: true } } ) ).toBe( true );
		expect( isCollectingResponses( { ...base, hostingerReach: { enabledForForm: true } } ) ).toBe(
			true
		);
		expect(
			isCollectingResponses( {
				...base,
				salesforceData: { sendToSalesforce: true, organizationId: '00D5g000000abcd' },
			} )
		).toBe( true );
	} );

	it( 'ignores Salesforce without an organization id', () => {
		expect(
			isCollectingResponses( {
				emailNotifications: false,
				saveResponses: false,
				salesforceData: { sendToSalesforce: true, organizationId: '' },
			} )
		).toBe( false );
	} );

	it( 'does not count jetpackCRM unless explicitly enabled', () => {
		expect( isCollectingResponses( { emailNotifications: false, saveResponses: false } ) ).toBe(
			false
		);
	} );
} );
