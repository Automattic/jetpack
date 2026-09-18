import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import userEvent from '@testing-library/user-event';
import { createReduxStore, register } from '@wordpress/data';
import { render, screen } from 'test/test-utils';
import SupportInfo from '../index';

jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn().mockReturnValue( false ),
} ) );

// Stand-in for the Help Center store that `WpcomSupportLink` dispatches to on WordPress.com.
const setShowSupportDoc = jest.fn( ( link, postId ) => ( {
	type: 'SHOW_SUPPORT_DOC',
	link,
	postId,
} ) );

describe( 'SupportInfo', () => {
	const testProps = {
		text: 'Hello world!',
		link: 'https://foo.com/',
		privacyLink: 'https://foo.com/privacy/',
	};

	it( 'should have a proper "Learn more" link', async () => {
		const user = userEvent.setup();
		render( <SupportInfo { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
		expect(
			screen.getByRole( 'link', { name: 'Learn more(opens in a new tab)' } )
		).toHaveAttribute( 'href', 'https://foo.com/' );
	} );

	it( 'should have a proper "Privacy Information" link', async () => {
		const user = userEvent.setup();
		render( <SupportInfo { ...testProps } /> );
		await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
		expect(
			screen.getByRole( 'link', { name: 'Privacy information(opens in a new tab)' } )
		).toHaveAttribute( 'href', 'https://foo.com/privacy/' );
	} );

	describe( 'with a wpcomLink', () => {
		const wpcomProps = { ...testProps, wpcomLink: 'https://wordpress.com/support/foo/' };

		afterEach( () => {
			isWpcomPlatformSite.mockReturnValue( false );
		} );

		it( 'should keep the Jetpack links on self-hosted sites', async () => {
			const user = userEvent.setup();
			render( <SupportInfo { ...wpcomProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
			expect(
				screen.getByRole( 'link', { name: 'Learn more(opens in a new tab)' } )
			).toHaveAttribute( 'href', 'https://foo.com/' );
			expect(
				screen.getByRole( 'link', { name: 'Privacy information(opens in a new tab)' } )
			).toBeInTheDocument();
		} );

		it( 'should link to the WordPress.com doc and hide privacy info on WordPress.com sites', async () => {
			isWpcomPlatformSite.mockReturnValue( true );
			const user = userEvent.setup();
			render( <SupportInfo { ...wpcomProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
			expect( screen.getByRole( 'link', { name: /Learn more/ } ) ).toHaveAttribute(
				'href',
				'https://wordpress.com/support/foo/'
			);
			expect(
				screen.queryByRole( 'link', { name: /Privacy information/ } )
			).not.toBeInTheDocument();
		} );

		it( 'should open the WordPress.com doc in the Help Center when its store is available', async () => {
			isWpcomPlatformSite.mockReturnValue( true );
			register(
				createReduxStore( 'automattic/help-center', {
					reducer: ( state = {} ) => state,
					actions: { setShowSupportDoc },
				} )
			);
			const user = userEvent.setup();
			render( <SupportInfo { ...wpcomProps } wpcomPostId={ 123 } /> );
			await user.click( screen.getByRole( 'button', { name: 'Learn more' } ) );
			await user.click( screen.getByRole( 'link', { name: 'Learn more' } ) );
			expect( setShowSupportDoc ).toHaveBeenCalledWith( 'https://wordpress.com/support/foo/', 123 );
		} );
	} );
} );
