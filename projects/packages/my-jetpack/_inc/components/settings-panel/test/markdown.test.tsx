import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { MarkdownSettings } from '../markdown';
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

const build = ( overrides: Partial< MyJetpackModule > = {} ) =>
	( {
		module: 'markdown',
		name: 'Markdown',
		activated: true,
		override: false,
		options: {
			wpcom_publish_posts_with_markdown: { current_value: true },
			wpcom_publish_comments_with_markdown: { current_value: false },
		},
		...overrides,
	} ) as unknown as MyJetpackModule;

const postsSwitch = () => screen.getByRole( 'switch', { name: /posts and pages/ } );
const commentsSwitch = () => screen.getByRole( 'switch', { name: /comments/ } );

beforeEach( () => {
	jest.clearAllMocks();
	( apiFetch as unknown as jest.Mock ).mockResolvedValue( {} );
} );

describe( 'MarkdownSettings', () => {
	it( 'shows each option with its stored value', () => {
		render( <MarkdownSettings module={ build() } disabled={ false } /> );

		expect( postsSwitch() ).toBeChecked();
		expect( commentsSwitch() ).not.toBeChecked();
	} );

	it( 'saves the comments option on its own', async () => {
		render( <MarkdownSettings module={ build() } disabled={ false } /> );
		await userEvent.click( commentsSwitch() );

		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/jetpack/v4/settings',
			method: 'POST',
			data: { wpcom_publish_comments_with_markdown: true },
		} );
	} );

	it.each( [
		[ 'the module is off', { activated: false }, false ],
		[ 'the site cannot use it', {}, true ],
	] )( 'locks both options when %s', ( _name, overrides, disabled ) => {
		render( <MarkdownSettings module={ build( overrides ) } disabled={ disabled } /> );

		expect( postsSwitch() ).toHaveAttribute( 'aria-disabled', 'true' );
		expect( commentsSwitch() ).toHaveAttribute( 'aria-disabled', 'true' );
	} );

	it( 'locks the module switch when the site cannot use it', () => {
		render( <MarkdownSettings module={ build() } disabled /> );

		expect( screen.getByRole( 'checkbox', { name: 'Enable Markdown' } ) ).toBeDisabled();
	} );
} );
