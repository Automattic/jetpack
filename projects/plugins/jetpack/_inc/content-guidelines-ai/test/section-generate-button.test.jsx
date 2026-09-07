import { useAiFeature } from '@automattic/jetpack-ai-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import SectionGenerateButton from '../components/section-generate-button';
import { useSectionHasDraft } from '../hooks/use-drafts';
import { suggestGuidelines } from '../lib/api';
import { readSectionDraft } from '../lib/drafts';
import { recordGuidelinesEvent } from '../lib/tracks';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '@wordpress/components', () => ( {
	Button: ( {
		children,
		onClick,
		disabled,
		href,
		className,
		style,
		label,
		'aria-hidden': ariaHidden,
	} ) => (
		<button
			type="button"
			onClick={ onClick }
			disabled={ disabled }
			href={ href }
			className={ className }
			style={ style }
			aria-hidden={ ariaHidden }
			aria-label={ label }
		>
			{ children }
		</button>
	),
	Tooltip: ( { children } ) => children,
	Notice: ( { children, onRemove, isDismissible } ) => (
		<div>
			{ children }
			{ isDismissible !== false && (
				<button type="button" aria-label="Close" onClick={ onRemove }>
					Close
				</button>
			) }
		</div>
	),
	Spinner: () => <span className="components-spinner" />,
} ) );
jest.mock( '@automattic/jetpack-ai-client', () => ( { useAiFeature: jest.fn() } ) );
// @wordpress/notices pulls in @wordpress/components transitively; mock it so
// that chain (rich-text -> combineReducers) never loads under the test's
// partial @wordpress/data mock.
jest.mock( '@wordpress/notices', () => ( { store: {} } ) );
jest.mock( '../hooks/use-drafts', () => ( { useSectionHasDraft: jest.fn() } ) );
jest.mock( '../lib/api', () => ( { suggestGuidelines: jest.fn() } ) );
jest.mock( '../lib/drafts', () => ( { readSectionDraft: jest.fn() } ) );
jest.mock( '../lib/tracks', () => ( { recordGuidelinesEvent: jest.fn() } ) );

const bag = {
	startSectionLoading: jest.fn(),
	stopSectionLoading: jest.fn(),
	setSuggestion: jest.fn(),
	showUpgradeNotice: jest.fn(),
	createErrorNotice: jest.fn(),
};

function setup( { hasFeature = true, hasDraft = false, sectionLoading = false } ) {
	useAiFeature.mockReturnValue( { hasFeature } );
	useSectionHasDraft.mockReturnValue( hasDraft );
	useDispatch.mockReturnValue( bag );
	useSelect.mockImplementation( map =>
		map( () => ( { isSectionLoading: () => sectionLoading } ) )
	);
}

let user;

describe( 'SectionGenerateButton', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		user = userEvent.setup();
	} );

	it( 'labels the button Generate when the section is empty', async () => {
		setup( { hasDraft: false } );
		render( <SectionGenerateButton slug="copy" /> );
		expect( screen.getByRole( 'button', { name: 'Generate guidelines' } ) ).toBeInTheDocument();
	} );

	it( 'labels the button Improve when the section already has a draft', async () => {
		setup( { hasDraft: true } );
		render( <SectionGenerateButton slug="copy" /> );
		expect( screen.getByRole( 'button', { name: 'Improve guidelines' } ) ).toBeInTheDocument();
	} );

	it( 'opens the upgrade notice instead of generating without an AI plan', async () => {
		setup( { hasFeature: false } );
		render( <SectionGenerateButton slug="copy" /> );

		await user.click( screen.getByRole( 'button', { name: /guidelines/i } ) );

		expect( bag.showUpgradeNotice ).toHaveBeenCalledTimes( 1 );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'upgrade_notice', {
			trigger: 'section',
			slug: 'copy',
		} );
		expect( suggestGuidelines ).not.toHaveBeenCalled();
	} );

	it( 'generates from an empty draft and stores the suggestion', async () => {
		setup( {} );
		readSectionDraft.mockReturnValue( '' );
		suggestGuidelines.mockResolvedValue( { suggestions: { copy: 'AI generated text.' } } );

		render( <SectionGenerateButton slug="copy" /> );
		await user.click( screen.getByRole( 'button', { name: 'Generate guidelines' } ) );

		await waitFor( () =>
			expect( bag.setSuggestion ).toHaveBeenCalledWith( 'copy', 'AI generated text.' )
		);
		expect( suggestGuidelines ).toHaveBeenCalledWith( [ 'copy' ], {} );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'generate', {
			type: 'section',
			slug: 'copy',
			action: 'generate',
		} );
		expect( bag.stopSectionLoading ).toHaveBeenCalledWith( 'copy' );
	} );

	it( 'sends existing text and records an improve action when a draft exists', async () => {
		setup( { hasDraft: true } );
		readSectionDraft.mockReturnValue( 'Existing copy guideline.' );
		suggestGuidelines.mockResolvedValue( { suggestions: { copy: 'Refined.' } } );

		render( <SectionGenerateButton slug="copy" /> );
		await user.click( screen.getByRole( 'button', { name: 'Improve guidelines' } ) );

		await waitFor( () => expect( bag.setSuggestion ).toHaveBeenCalled() );
		expect( suggestGuidelines ).toHaveBeenCalledWith( [ 'copy' ], {
			copy: 'Existing copy guideline.',
		} );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'generate', {
			type: 'section',
			slug: 'copy',
			action: 'improve',
		} );
	} );

	it( 'shows an error notice when generation fails', async () => {
		setup( {} );
		readSectionDraft.mockReturnValue( '' );
		suggestGuidelines.mockRejectedValue( new Error( 'boom' ) );

		render( <SectionGenerateButton slug="copy" /> );
		await user.click( screen.getByRole( 'button', { name: 'Generate guidelines' } ) );

		await waitFor( () => expect( bag.createErrorNotice ).toHaveBeenCalled() );
		expect( bag.setSuggestion ).not.toHaveBeenCalled();
		expect( bag.stopSectionLoading ).toHaveBeenCalledWith( 'copy' );
	} );

	it( 'disables the button while the section is loading', async () => {
		setup( { sectionLoading: true } );
		render( <SectionGenerateButton slug="copy" /> );
		expect( screen.getByRole( 'button', { name: /guidelines/i } ) ).toBeDisabled();
	} );
} );
