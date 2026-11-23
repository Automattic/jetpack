import { render, screen } from 'test/test-utils';
import { PostByEmailOnProfile } from '../post-by-email-moved';

// The real card shows users who cannot manage modules only the Post by Email and Publicize modules.
jest.mock( 'components/settings-card', () => ( {
	__esModule: true,
	default: ( { module, children } ) => <section aria-label={ module }>{ children }</section>,
} ) );

jest.mock( 'components/settings-group', () => ( {
	__esModule: true,
	default: ( { children } ) => children,
} ) );

describe( 'PostByEmailOnProfile', () => {
	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'links users who cannot manage modules to their Profile page', () => {
		window.JetpackScriptData = { site: { admin_url: 'https://example.com/wp-admin/' } };

		render( <PostByEmailOnProfile /> );

		expect( screen.getByRole( 'region', { name: 'post-by-email' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Open your profile' } ) ).toHaveAttribute(
			'href',
			'https://example.com/wp-admin/profile.php#post-by-email'
		);
	} );
} );
