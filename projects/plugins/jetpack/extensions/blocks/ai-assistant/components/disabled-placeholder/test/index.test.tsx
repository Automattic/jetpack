import { render, screen } from '@testing-library/react';
import DisabledPlaceholder from '..';

let mockAvailability: {
	available: boolean;
	unavailableReason?: string;
	details?: Record< string, unknown >;
};

jest.mock( '@automattic/jetpack-ai-client', () => ( {
	aiAssistantIcon: null,
} ) );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getJetpackExtensionAvailability: () => mockAvailability,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
} ) );

const setCanManageOptions = ( canManage: boolean ) => {
	window.JetpackScriptData = {
		site: { admin_url: 'https://example.com/wp-admin/' },
		user: { current_user: { capabilities: { manage_options: canManage } } },
	} as unknown as Window[ 'JetpackScriptData' ];
};

describe( 'DisabledPlaceholder', () => {
	beforeEach( () => {
		mockAvailability = {
			available: false,
			unavailableReason: 'ai_disabled',
			details: { gate: 'master' },
		};
		setCanManageOptions( true );
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'explains that Jetpack AI is off when the master switch is the gate', () => {
		render( <DisabledPlaceholder /> );

		// Placeholder renders its instructions twice, once visually hidden for screen readers.
		expect( screen.getAllByText( /Jetpack AI is turned off for this site/ ) ).not.toHaveLength( 0 );
	} );

	it( 'explains that the Writing Assistant is off when that setting is the gate', () => {
		mockAvailability.details = { gate: 'writing_assistant' };

		render( <DisabledPlaceholder /> );

		expect(
			screen.getAllByText( /The Writing Assistant is turned off for this site/ )
		).not.toHaveLength( 0 );
	} );

	it( 'links administrators to the AI settings page', () => {
		render( <DisabledPlaceholder /> );

		expect( screen.getByRole( 'link', { name: 'Manage AI settings' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/admin.php?page=jetpack-ai#/features'
		);
	} );

	it( 'does not show the settings link to users who cannot manage options', () => {
		setCanManageOptions( false );

		render( <DisabledPlaceholder /> );

		expect( screen.queryByRole( 'link', { name: 'Manage AI settings' } ) ).not.toBeInTheDocument();
	} );
} );
