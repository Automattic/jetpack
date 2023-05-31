import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { ConnectButton } from '../index';

// Mock components that do fetches in the background. We supply needed state directly.
jest.mock( 'components/data/query-site-benefits', () => ( {
	__esModule: true,
	default: () => 'query-site-benefits',
} ) );

describe( 'ConnectButton', () => {
	const testProps = {
		apiNonce: '',
		apiRoot: '',
		fetchingConnectUrl: false,
		connectUrl: 'https://jetpack.wordpress.com/jetpack.authorize/1/',
		connectUser: true,
		from: '',
		isSiteConnected: false,
		isDisconnecting: false,
		isLinked: false,
		isUnlinking: false,
		asLink: false,
		connectInPlace: false,
		doNotUseConnectionIframe: false,
	};

	describe( 'Initially', () => {
		it( 'renders a button to connect or link', () => {
			render( <ConnectButton { ...testProps } fetchingConnectUrl={ true } /> );
			expect(
				screen.getByRole( 'link', { name: 'Connect your WordPress.com account' } )
			).toBeInTheDocument();
		} );

		it( 'disables the button while fetching the connect URL', () => {
			render( <ConnectButton { ...testProps } fetchingConnectUrl={ true } /> );
			expect( screen.getByRole( 'link', { name: 'Connect your WordPress.com account' } ) )
				// eslint-disable-next-line jest-dom/prefer-enabled-disabled -- `.toBeDisabled()` doesn't work on links.
				.toHaveAttribute( 'disabled' );
		} );
	} );

	describe( 'When it is used to link a user', () => {
		it( 'has a link to jetpack.wordpress.com', () => {
			render( <ConnectButton { ...testProps } /> );
			expect(
				screen.getByRole( 'link', { name: 'Connect your WordPress.com account' } )
			).toHaveAttribute( 'href', 'https://jetpack.wordpress.com/jetpack.authorize/1/' );
		} );
	} );

	describe( 'When it is used to link a user in-place', () => {
		const currentTestProps = {
			...testProps,
			isSiteConnected: true,
			connectUser: true,
			connectInPlace: true,
			connectLegend: 'Link your account to WordPress.com',
		};

		it( 'has a link to jetpack.wordpress.com', () => {
			render( <ConnectButton { ...currentTestProps } /> );
			expect(
				screen.getByRole( 'link', { name: 'Link your account to WordPress.com' } )
			).toHaveAttribute( 'href', 'https://jetpack.wordpress.com/jetpack.authorize/1/' );
		} );

		it( 'when clicked, loadIframe() is called once', async () => {
			const user = userEvent.setup();
			const loadIframe = jest.fn( e => e.preventDefault() );

			class ConnectButtonMock extends ConnectButton {
				constructor( props ) {
					super( props );
					this.loadIframe = loadIframe;
				}
			}

			render( <ConnectButtonMock { ...currentTestProps } /> );
			await user.click(
				screen.getByRole( 'link', { name: 'Link your account to WordPress.com' } )
			);
			expect( loadIframe ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'When it is used to unlink a user', () => {
		const currentTestProps = {
			...testProps,
			isLinked: true,
			unlinkUser: jest.fn(),
			connectLegend: 'Unlink your account from WordPress.com',
		};

		it( 'does not link to a URL', () => {
			render( <ConnectButton { ...currentTestProps } /> );
			expect(
				screen.getByRole( 'button', { name: 'Unlink your account from WordPress.com' } )
			).not.toHaveAttribute( 'href' );
		} );

		it( 'when clicked, unlinkUser() is called once', async () => {
			const user = userEvent.setup();
			render( <ConnectButton { ...currentTestProps } /> );
			await user.click(
				screen.getByRole( 'button', { name: 'Unlink your account from WordPress.com' } )
			);
			expect( currentTestProps.unlinkUser ).toHaveBeenCalledTimes( 1 );
		} );
	} );

	describe( 'When it is used to connect a site', () => {
		const currentTestProps = {
			...testProps,
			connectUrl: 'http://example.org/wp-admin/admin.php?page=jetpack&action=register',
			isSiteConnected: false,
			isLinked: false,
			connectUser: false,
			connectLegend: 'Connect your site to WordPress.com',
		};

		it( 'has a link to Jetpack admin page in register mode', () => {
			render( <ConnectButton { ...currentTestProps } /> );
			expect(
				screen.getByRole( 'link', { name: 'Connect your site to WordPress.com' } )
			).toHaveAttribute(
				'href',
				'http://example.org/wp-admin/admin.php?page=jetpack&action=register'
			);
		} );

		it( "if prop 'from' has something, it's included in the link", () => {
			render( <ConnectButton { ...currentTestProps } from="somewhere" /> );
			expect(
				screen.getByRole( 'link', { name: 'Connect your site to WordPress.com' } )
			).toHaveAttribute(
				'href',
				'http://example.org/wp-admin/admin.php?page=jetpack&action=register&from=somewhere'
			);
		} );
	} );

	describe( 'When it is used to disconnect a site', () => {
		const currentTestProps = {
			...testProps,
			isSiteConnected: true,
			connectUser: false,
			connectLegend: 'Disconnect your site from WordPress.com',
		};

		it( 'does not link to a URL', () => {
			render( <ConnectButton { ...currentTestProps } /> );
			expect(
				screen.getByRole( 'button', { name: 'Disconnect your site from WordPress.com' } )
			).not.toHaveAttribute( 'href' );
		} );

		it( 'when clicked, handleOpenModal() is called once', async () => {
			const user = userEvent.setup();
			const handleOpenModal = jest.fn( e => e.preventDefault() );

			class ConnectButtonMock extends ConnectButton {
				constructor( props ) {
					super( props );
					this.handleOpenModal = handleOpenModal;
				}
			}

			render( <ConnectButtonMock { ...currentTestProps } /> );
			await user.click(
				screen.getByRole( 'button', { name: 'Disconnect your site from WordPress.com' } )
			);
			expect( handleOpenModal ).toHaveBeenCalledTimes( 1 );
		} );
	} );
} );
