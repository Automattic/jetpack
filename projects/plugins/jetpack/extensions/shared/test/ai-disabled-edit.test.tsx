import { getJetpackExtensionAvailability } from '@automattic/jetpack-shared-extension-utils';
import { render, screen } from '@testing-library/react';
import AiDisabledEdit from '../components/ai-disabled-edit';

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	getJetpackExtensionAvailability: jest.fn( () => ( { available: false } ) ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: () => ( {} ),
} ) );

it.each( [
	[
		'AI Assistant',
		'jetpack/ai-assistant',
		'Jetpack AI is disabled so this block can’t generate content. Enable Jetpack AI to use it again.',
	],
	[
		'Jetpack AI Search',
		'jetpack/ai-chat',
		'Jetpack AI is disabled so visitors won’t see this block. Enable Jetpack AI to let visitors ask questions about your content.',
	],
] as const )( 'shows the disabled notice for %s', ( label, name, instructions ) => {
	render( <AiDisabledEdit name={ name } /> );

	expect( screen.getByText( label ) ).toBeInTheDocument();
	expect( screen.getAllByText( instructions ).length ).toBeGreaterThan( 0 );
	expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
} );

it( 'explains how to enable the Writing Assistant feature', () => {
	jest.mocked( getJetpackExtensionAvailability ).mockReturnValueOnce( {
		available: false,
		unavailableReason: 'ai_disabled',
		details: { feature: 'writing_assistant' },
	} );

	render( <AiDisabledEdit name="jetpack/ai-assistant" /> );

	expect(
		screen.getAllByText(
			'The Writing Assistant is turned off for this site, so this block can’t generate content. Turn the Writing Assistant on in Jetpack AI settings to use it again.'
		).length
	).toBeGreaterThan( 0 );
	expect( screen.queryByText( /Enable Jetpack AI/ ) ).not.toBeInTheDocument();
} );
