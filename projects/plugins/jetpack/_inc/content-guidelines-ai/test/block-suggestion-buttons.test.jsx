import { useAiFeature } from '@automattic/jetpack-ai-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect, useDispatch } from '@wordpress/data';
import BlockSuggestionButtons from '../components/block-suggestion-buttons';
import { useBlockHasDraft } from '../hooks/use-drafts';
import { suggestGuidelines } from '../lib/api';
import { acceptBlockSuggestion } from '../lib/dom';
import { getBlockModalTextarea } from '../lib/drafts';
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
jest.mock( '../hooks/use-drafts', () => ( { useBlockHasDraft: jest.fn() } ) );
jest.mock( '../lib/api', () => ( { suggestGuidelines: jest.fn() } ) );
jest.mock( '../lib/dom', () => ( { acceptBlockSuggestion: jest.fn() } ) );
jest.mock( '../lib/drafts', () => ( { getBlockModalTextarea: jest.fn() } ) );
jest.mock( '../lib/tracks', () => ( { recordGuidelinesEvent: jest.fn() } ) );

const bag = {
	startSectionLoading: jest.fn(),
	stopSectionLoading: jest.fn(),
	setSuggestion: jest.fn(),
	clearSuggestion: jest.fn(),
	createErrorNotice: jest.fn(),
};
const blockModal = { id: 'modal' };

function setup( {
	suggestion = '',
	hasFeature = true,
	hasDraft = false,
	blockLoading = false,
	modalValue = '',
} ) {
	useAiFeature.mockReturnValue( { hasFeature } );
	useBlockHasDraft.mockReturnValue( hasDraft );
	useDispatch.mockReturnValue( bag );
	getBlockModalTextarea.mockReturnValue( { value: modalValue } );
	const selectors = {
		isSectionLoading: () => blockLoading,
		getSuggestion: () => suggestion,
	};
	useSelect.mockImplementation( map => map( () => selectors ) );
}

let user;

describe( 'BlockSuggestionButtons', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		user = userEvent.setup();
	} );

	it( 'labels Generate with no block draft and Improve with one', async () => {
		setup( { hasDraft: false } );
		const { rerender } = render(
			<BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } />
		);
		expect( screen.getByRole( 'button', { name: 'Generate guidelines' } ) ).toBeInTheDocument();

		useBlockHasDraft.mockReturnValue( true );
		rerender( <BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } /> );
		expect( screen.getByRole( 'button', { name: 'Improve guidelines' } ) ).toBeInTheDocument();
	} );

	it( 'disables the button without an AI plan', async () => {
		setup( { hasFeature: false } );
		render( <BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } /> );
		expect( screen.getByRole( 'button', { name: /guidelines/i } ) ).toBeDisabled();
	} );

	it( 'generates from the modal textarea content', async () => {
		setup( { modalValue: '' } );
		suggestGuidelines.mockResolvedValue( { suggestions: { 'core/image': 'Add alt text.' } } );

		render( <BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } /> );
		await user.click( screen.getByRole( 'button', { name: 'Generate guidelines' } ) );

		await waitFor( () =>
			expect( bag.setSuggestion ).toHaveBeenCalledWith( 'core/image', 'Add alt text.' )
		);
		expect( suggestGuidelines ).toHaveBeenCalledWith( [ 'core/image' ], {} );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'generate', {
			type: 'block',
			slug: 'core/image',
			action: 'generate',
		} );
	} );

	it( 'sends the modal text and records improve when the modal is prefilled', async () => {
		setup( { modalValue: 'Existing block guideline.' } );
		suggestGuidelines.mockResolvedValue( { suggestions: { 'core/image': 'Refined.' } } );

		render( <BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } /> );
		await user.click( screen.getByRole( 'button', { name: /guidelines/i } ) );

		await waitFor( () => expect( bag.setSuggestion ).toHaveBeenCalled() );
		expect( suggestGuidelines ).toHaveBeenCalledWith( [ 'core/image' ], {
			'core/image': 'Existing block guideline.',
		} );
		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'generate', {
			type: 'block',
			slug: 'core/image',
			action: 'improve',
		} );
	} );

	it( 'surfaces an error notice when block generation fails', async () => {
		setup( {} );
		suggestGuidelines.mockRejectedValue( new Error( 'nope' ) );

		render( <BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } /> );
		await user.click( screen.getByRole( 'button', { name: /guidelines/i } ) );

		await waitFor( () => expect( bag.createErrorNotice ).toHaveBeenCalled() );
		expect( bag.setSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'shows Accept/Dismiss once a suggestion exists and wires them up', async () => {
		setup( { suggestion: 'Add alt text.' } );
		render( <BlockSuggestionButtons blockName="core/image" blockModal={ blockModal } /> );

		await user.click( screen.getByRole( 'button', { name: 'Accept suggestion' } ) );
		expect( acceptBlockSuggestion ).toHaveBeenCalledWith(
			blockModal,
			'core/image',
			'Add alt text.',
			bag.clearSuggestion
		);

		await user.click( screen.getByRole( 'button', { name: 'Dismiss' } ) );
		expect( bag.clearSuggestion ).toHaveBeenCalledWith( 'core/image' );
	} );
} );
