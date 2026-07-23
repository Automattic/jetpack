import { render, screen, fireEvent } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import BlockSuggestionActions from '../components/block-suggestion-actions';
import { acceptBlockSuggestion } from '../lib/dom';
import { getBlockModalTextarea } from '../lib/drafts';
import { recordGuidelinesEvent } from '../lib/tracks';

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );
jest.mock( '../lib/dom', () => ( { acceptBlockSuggestion: jest.fn() } ) );
jest.mock( '../lib/drafts', () => ( { getBlockModalTextarea: jest.fn() } ) );
jest.mock( '../lib/tracks', () => ( { recordGuidelinesEvent: jest.fn() } ) );

const clearSuggestion = jest.fn();

function setup( { suggestion = '', blockLoading = false } ) {
	useDispatch.mockReturnValue( { clearSuggestion } );
	const selectors = {
		getSuggestion: () => suggestion,
		isSectionLoading: () => blockLoading,
	};
	useSelect.mockImplementation( map => map( () => selectors ) );
	getBlockModalTextarea.mockReturnValue( null );
}

function makeModal() {
	const modal = document.createElement( 'div' );
	modal.className = 'block-guideline-modal';
	document.body.appendChild( modal );
	return modal;
}

describe( 'BlockSuggestionActions', () => {
	beforeEach( () => jest.clearAllMocks() );
	afterEach( () => {
		document.body.innerHTML = '';
	} );

	it( 'renders nothing without a suggestion', () => {
		setup( { suggestion: '' } );
		const { container } = render(
			<BlockSuggestionActions blockName="core/paragraph" blockModal={ makeModal() } />
		);
		expect( container ).toBeEmptyDOMElement();
	} );

	it( 'renders the diff and accepts the block suggestion on click', () => {
		setup( { suggestion: 'Keep paragraphs short.' } );
		const modal = makeModal();
		render( <BlockSuggestionActions blockName="core/paragraph" blockModal={ modal } /> );

		fireEvent.click( screen.getByRole( 'button', { name: /accept suggested changes/i } ) );

		expect( recordGuidelinesEvent ).toHaveBeenCalledWith( 'accept', {
			type: 'block',
			slug: 'core/paragraph',
		} );
		expect( acceptBlockSuggestion ).toHaveBeenCalledWith(
			modal,
			'core/paragraph',
			'Keep paragraphs short.',
			clearSuggestion
		);
	} );

	it( 'clears the stale block suggestion when the modal unmounts', () => {
		setup( { suggestion: 'Keep paragraphs short.' } );
		const { unmount } = render(
			<BlockSuggestionActions blockName="core/paragraph" blockModal={ makeModal() } />
		);

		unmount();
		expect( clearSuggestion ).toHaveBeenCalledWith( 'core/paragraph' );
	} );
} );
