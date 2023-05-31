import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { render, screen } from 'test/test-utils';
import { ReconnectModal } from '../index';

describe( 'ReconnectModal', () => {
	const defaultTestProps = {
		show: true,
		onHide: jest.fn(),
		isSiteConnected: true,
		isReconnectingSite: false,
	};

	describe( 'Initially', () => {
		it( 'renders the modal', () => {
			render( <ReconnectModal { ...defaultTestProps } /> );
			expect( screen.getByRole( 'heading', { name: 'Reconnect Jetpack' } ) ).toBeInTheDocument();
		} );

		describe( 'Cancel button', () => {
			it( 'has a Cancel button', () => {
				render( <ReconnectModal { ...defaultTestProps } /> );
				expect( screen.getByRole( 'button', { name: 'Cancel' } ) ).toBeInTheDocument();
			} );

			it( 'when clicked, closeModal() is called once', async () => {
				const user = userEvent.setup();
				const closeModal = jest.fn();

				render( <ReconnectModal { ...defaultTestProps } onHide={ closeModal } /> );
				await user.click( screen.getByRole( 'button', { name: 'Cancel' } ) );
				expect( closeModal ).toHaveBeenCalledTimes( 1 );
			} );
		} );

		describe( 'Reconnect button', () => {
			it( 'has a Reconnect button', () => {
				render( <ReconnectModal { ...defaultTestProps } /> );
				expect( screen.getByRole( 'button', { name: 'Reconnect Jetpack' } ) ).toBeInTheDocument();
			} );

			it( 'when clicked, clickReconnectSite() is called once', async () => {
				const user = userEvent.setup();
				const clickReconnectSite = jest.fn();

				render(
					<ReconnectModal { ...defaultTestProps } clickReconnectSite={ clickReconnectSite } />
				);
				await user.click( screen.getByRole( 'button', { name: 'Reconnect Jetpack' } ) );
				expect( clickReconnectSite ).toHaveBeenCalledTimes( 1 );
			} );
		} );
	} );

	describe( 'When the site is not connected', () => {
		const props = {
			...defaultTestProps,
			isSiteConnected: false,
		};

		it( "doesn't render the modal", () => {
			const { container } = render( <ReconnectModal { ...props } /> );
			expect( container ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'When a reconnect is already in progress', () => {
		const props = {
			...defaultTestProps,
			isReconnectingSite: true,
		};

		it( "doesn't render the modal", () => {
			const { container } = render( <ReconnectModal { ...props } /> );
			expect( container ).toBeEmptyDOMElement();
		} );
	} );

	describe( 'When `show` is false', () => {
		const props = {
			...defaultTestProps,
			show: false,
		};

		it( "doesn't render the modal", () => {
			const { container } = render( <ReconnectModal { ...props } /> );
			expect( container ).toBeEmptyDOMElement();
		} );
	} );
} );
