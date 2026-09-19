import { render, screen } from '@testing-library/react';
import DisabledEdit from '..';

let mockAvailability: {
	available: boolean;
	unavailableReason?: string;
	details?: Record< string, unknown >;
};

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getJetpackExtensionAvailability: () => mockAvailability,
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
} ) );

describe( 'DisabledEdit', () => {
	beforeEach( () => {
		mockAvailability = {
			available: false,
			unavailableReason: 'ai_disabled',
			details: { gate: 'master' },
		};
	} );

	it( 'explains that Jetpack AI is off when the master switch is the gate', () => {
		render( <DisabledEdit /> );

		expect( screen.getByText( 'AI Assistant' ) ).toBeInTheDocument();
		// Placeholder renders its instructions twice, once visually hidden for screen readers.
		expect( screen.getAllByText( /Jetpack AI is turned off for this site/ ) ).not.toHaveLength( 0 );
	} );

	it( 'explains that the Writing Assistant is off when that setting is the gate', () => {
		mockAvailability.details = { gate: 'writing_assistant' };

		render( <DisabledEdit /> );

		expect(
			screen.getAllByText( /The Writing Assistant is turned off for this site/ )
		).not.toHaveLength( 0 );
	} );
} );
