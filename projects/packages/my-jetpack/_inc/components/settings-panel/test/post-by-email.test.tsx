import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { clearRequestedSwitch, setRequestedSwitch } from '../../../data/requested-switch-state';
import { PostByEmailSettings } from '../post-by-email';
import type { MyJetpackModule } from '../../../types';

const mockFetchModules = jest.fn();
const mockCreateErrorNotice = jest.fn();
const mockCreateSuccessNotice = jest.fn();
const mockCopyRef = jest.fn();
const mockUseCopyToClipboard = jest.fn< typeof mockCopyRef, [ string, () => void ] >(
	() => mockCopyRef
);
let mockAccountConnected = true;

jest.mock( '@wordpress/api-fetch', () => jest.fn() );
jest.mock( '@automattic/jetpack-shared-stores', () => ( { store: {} } ) );
jest.mock( '@wordpress/notices', () => ( { store: 'core/notices' } ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( {
		fetchModules: mockFetchModules,
		createErrorNotice: mockCreateErrorNotice,
		createSuccessNotice: mockCreateSuccessNotice,
	} ),
} ) );
jest.mock( '@wordpress/compose', () => ( {
	useCopyToClipboard: ( text: string, onSuccess: () => void ) =>
		mockUseCopyToClipboard( text, onSuccess ),
} ) );
jest.mock( '../../my-jetpack-tab-panel/features/feature-state', () => ( {
	useAccountConnected: () => mockAccountConnected,
} ) );
jest.mock( '../../module-toggle', () => ( {
	ModuleToggle: ( { labelledby, disabled }: { labelledby?: string; disabled?: boolean } ) => (
		<input type="checkbox" aria-labelledby={ labelledby } disabled={ disabled } />
	),
} ) );

const ADDRESS = 'abc123@post.wordpress.com';

const build = ( stored: unknown = ADDRESS, overrides: Partial< MyJetpackModule > = {} ) =>
	( {
		module: 'post-by-email',
		name: 'Post by Email',
		description: 'Publish blog posts simply by sending an email to a custom address.',
		activated: true,
		override: false,
		options: { post_by_email_address: { current_value: stored } },
		...overrides,
	} ) as unknown as MyJetpackModule;

const field = () => screen.getByRole( 'textbox', { name: /email address/ } );

let switchToken: number | null = null;

beforeEach( () => {
	jest.clearAllMocks();
	mockAccountConnected = true;
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
} );

afterEach( () => {
	if ( switchToken !== null ) {
		clearRequestedSwitch( 'module:post-by-email', switchToken );
		switchToken = null;
	}
} );

describe( 'PostByEmailSettings', () => {
	it( 'shows the stored address, offers to regenerate it, and copies it', () => {
		render( <PostByEmailSettings module={ build() } disabled={ false } /> );

		expect( field() ).toHaveValue( ADDRESS );
		expect( screen.getByRole( 'button', { name: 'Regenerate address' } ) ).not.toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( mockUseCopyToClipboard ).toHaveBeenLastCalledWith( ADDRESS, expect.any( Function ) );
		expect( mockCopyRef ).toHaveBeenCalledWith( screen.getByRole( 'button', { name: 'Copy' } ) );
	} );

	it.each( [ false, '1', null, 'NULL' ] )(
		'offers to create an address when the stored value is %p',
		stored => {
			render( <PostByEmailSettings module={ build( stored ) } disabled={ false } /> );

			expect( field() ).toHaveValue( '' );
			expect( screen.getByRole( 'button', { name: 'Create address' } ) ).not.toHaveAttribute(
				'aria-disabled',
				'true'
			);
			expect( screen.getByRole( 'button', { name: 'Copy' } ) ).toHaveAttribute(
				'aria-disabled',
				'true'
			);
			expect( mockCopyRef ).not.toHaveBeenCalledWith( expect.anything() );
		}
	);

	it( 'asks for a new address, keeping the stored one in view until the modules refetch', async () => {
		( apiFetch as unknown as jest.Mock ).mockReturnValue( new Promise( () => undefined ) );
		render( <PostByEmailSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Regenerate address' } ) );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { post_by_email_address: 'regenerate' },
		} );
		expect( field() ).toHaveValue( ADDRESS );
		expect( screen.getByRole( 'button', { name: 'Regenerate address' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
	} );

	it( 'refetches the modules once the new address is made', async () => {
		render( <PostByEmailSettings module={ build() } disabled={ false } /> );
		await userEvent.click( screen.getByRole( 'button', { name: 'Regenerate address' } ) );

		await waitFor( () => expect( mockCreateSuccessNotice ).toHaveBeenCalledTimes( 1 ) );
		expect( mockFetchModules ).toHaveBeenCalledTimes( 1 );
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false, true, false ],
		[ 'the site cannot use it', {}, true, true, false ],
		[ 'the current user has no WordPress.com account connected', {}, false, false, false ],
		[ 'the module switch request is still running', {}, false, true, true ],
	] )( 'locks the address when %s', ( _name, overrides, disabled, accountConnected, switching ) => {
		mockAccountConnected = accountConnected;
		if ( switching ) {
			switchToken = setRequestedSwitch( 'module:post-by-email', false );
		}
		render( <PostByEmailSettings module={ build( ADDRESS, overrides ) } disabled={ disabled } /> );

		expect( field() ).toBeDisabled();
		expect( screen.getByRole( 'button', { name: 'Regenerate address' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( screen.getByRole( 'button', { name: 'Copy' } ) ).toHaveAttribute(
			'aria-disabled',
			'true'
		);
		expect( mockCopyRef ).not.toHaveBeenCalledWith( expect.anything() );
	} );

	it.each( [
		[ 'the site cannot use it', true, true ],
		[ 'the current user has no WordPress.com account connected', false, false ],
	] )( 'locks the module switch when %s', ( _name, disabled, accountConnected ) => {
		mockAccountConnected = accountConnected;
		render( <PostByEmailSettings module={ build() } disabled={ disabled } /> );

		expect(
			screen.getByRole( 'checkbox', {
				name: 'Publish blog posts simply by sending an email to a custom address.',
			} )
		).toBeDisabled();
	} );

	it( 'says why the address is locked when the current user has no account connected', () => {
		mockAccountConnected = false;
		render( <PostByEmailSettings module={ build() } disabled={ false } /> );

		expect( screen.getByText( /Connect your WordPress.com account/ ) ).toBeInTheDocument();
	} );
} );
