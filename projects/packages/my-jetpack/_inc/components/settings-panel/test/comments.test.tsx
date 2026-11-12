import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { CommentsSettings } from '../comments';
import type { MyJetpackModule } from '../../../types';

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: jest.fn(),
		createErrorNotice: jest.fn(),
		createSuccessNotice: jest.fn(),
	} ),
} ) );
jest.mock( '../../../hooks/use-analytics', () => ( {
	__esModule: true,
	default: () => ( { recordEvent: jest.fn() } ),
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { labelledby, disabled }: { labelledby?: string; disabled?: boolean } ) => (
		<input type="checkbox" aria-labelledby={ labelledby } disabled={ disabled } />
	),
} ) );

const mockFetch = apiFetch as unknown as jest.Mock;

const build = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( {
		module: 'comments',
		name: 'Comments',
		activated: true,
		override: false,
		options: {
			enable_blocks_comments: { current_value: true },
			highlander_comment_form_prompt: { current_value: 'Leave a Reply' },
		},
		...overrides,
	} ) as unknown as MyJetpackModule;

const setBlocksAvailable = ( isCommentBlocksAvailable?: boolean ) => {
	window.JetpackScriptData = {
		jetpack: { isCommentBlocksAvailable },
	} as unknown as typeof window.JetpackScriptData;
};

const blocksSwitch = () => screen.queryByRole( 'switch', { name: 'Enable blocks in comments' } );
const introField = () => screen.getByRole( 'textbox', { name: 'Comment form introduction' } );
const posts = () => mockFetch.mock.calls.map( ( [ options ] ) => options.data );

beforeEach( () => {
	jest.clearAllMocks();
	mockFetch.mockResolvedValue( {} );
	setBlocksAvailable( true );
} );

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'CommentsSettings', () => {
	it.each( [
		[ 'offers', 'the plugin says they work', true, true ],
		[ 'hides', 'the plugin says they do not', false, false ],
		[ 'hides', 'an older plugin says nothing', undefined, false ],
	] )( '%s the blocks option when %s', ( _verb, _when, available, shown ) => {
		setBlocksAvailable( available );
		render( <CommentsSettings module={ build() } disabled={ false } /> );

		expect( blocksSwitch() !== null ).toBe( shown );
	} );

	it( 'saves the blocks option on its own', async () => {
		render( <CommentsSettings module={ build() } disabled={ false } /> );
		await userEvent.click( blocksSwitch()! );

		expect( posts() ).toEqual( [ { enable_blocks_comments: false } ] );
	} );

	it( 'saves the introduction on blur, and only when it changed', async () => {
		render( <CommentsSettings module={ build() } disabled={ false } /> );

		await userEvent.click( introField() );
		await userEvent.tab();
		expect( posts() ).toHaveLength( 0 );

		await userEvent.clear( introField() );
		await userEvent.type( introField(), 'Say hello' );
		expect( posts() ).toHaveLength( 0 );
		await userEvent.tab();

		await waitFor( () =>
			expect( posts() ).toEqual( [ { highlander_comment_form_prompt: 'Say hello' } ] )
		);
	} );

	it( 'locks the introduction while it saves, and keeps the typed text when the save fails', async () => {
		let failSave: () => void = () => undefined;
		mockFetch.mockImplementation(
			() =>
				new Promise( ( _resolve, reject ) => {
					failSave = () => reject( new Error( 'nope' ) );
				} )
		);
		render( <CommentsSettings module={ build() } disabled={ false } /> );

		await userEvent.clear( introField() );
		await userEvent.type( introField(), 'Say hello' );
		await userEvent.tab();
		expect( introField() ).toBeDisabled();

		failSave();
		await waitFor( () => expect( introField() ).toBeEnabled() );
		expect( introField() ).toHaveValue( 'Say hello' );
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false ],
		[ 'the site cannot use it', {}, true ],
	] )( 'locks the options when %s', ( _name, overrides, disabled ) => {
		render( <CommentsSettings module={ build( overrides ) } disabled={ disabled } /> );

		expect( blocksSwitch() ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( introField() ).toBeDisabled();
	} );

	it( 'locks the module switch when the site cannot use it', () => {
		render( <CommentsSettings module={ build() } disabled /> );

		expect(
			screen.getByRole( 'checkbox', { name: 'Use the Jetpack comment form' } )
		).toBeDisabled();
	} );
} );
