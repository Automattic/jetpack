/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import { PanelControls, ToolbarControls } from '../controls';
import useAutosaveAndRedirect from '../../../shared/use-autosave-and-redirect/index';

jest.mock( '../../../shared/use-autosave-and-redirect/index' );

describe( 'PanelControls', () => {
	const defaultAttributes = {
		planId: 1,
	};

	const defaultProducts = [
		{
			id: 1,
			currency: "USD",
			price: "10.00",
			interval: "1 month",
			title: "ten a month",
		},
	];

	const setMembershipAmount = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		clientId: 1,
		products: defaultProducts,
		setMembershipAmount: setMembershipAmount,
	};

	beforeEach( () => {
		setMembershipAmount.mockClear();
	} );

	test( 'loads and displays payment plan select list', () => {
		render( <PanelControls { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Payment plan' ) ).toBeInTheDocument();
	} );

	test( 'displays formatted product amounts in the payment plan select list', () => {
		render( <PanelControls { ...defaultProps } /> );

		expect( screen.getByDisplayValue( '$10.00 / month' ) ).toBeInTheDocument();
	} );

	test( 'sets country code attribute', () => {
		render( <PanelControls { ...defaultProps } /> );
		userEvent.selectOptions( screen.getByLabelText( 'Payment plan' ), [ '$10.00 / month' ] );

		expect( setMembershipAmount ).toHaveBeenCalledWith( "1" );
	} );

	test( 'loads and displays link to manage payments', () => {
		render( <PanelControls { ...defaultProps } /> );

		expect( screen.getByText( 'See your earnings, subscriber list, and payment plans.' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link' ).getAttribute( 'href' ) ).toMatch( /^https:\/\/wordpress.com\/earn\/payments?/ );
	} );
} );

describe( 'ToolbarControls', () => {
	const autosaveAndRedirect = jest.fn();

	const defaultProps = {
		connected: false,
		connectURL: 'http://www.test.com',
		hasUpgradeNudge: false,
		shouldUpgrade: false,
	};

	beforeEach( () => {
		useAutosaveAndRedirect.mockImplementation( () => ( {
			autosave: jest.fn(),
			isRedirecting: false,
			autosaveAndRedirect
		} ) );
	} );

	test( 'loads and displays Stripe connection button', () => {
		render( <ToolbarControls { ...defaultProps } /> );

		expect( screen.getByText( 'Connect Stripe' ) ).toBeInTheDocument();
	} );

	test( 'calls autosaveAndRedirect with the connectUrl when Stripe button is clicked', () => {
		render( <ToolbarControls { ...defaultProps } /> );
		userEvent.click( screen.getByText( 'Connect Stripe' ).firstChild );

		expect( useAutosaveAndRedirect ).toHaveBeenCalledWith( 'http://www.test.com' );
	} );

	test( 'does not display the Stripe button when the upgrade nudge is showing', () => {
		render( <ToolbarControls { ...defaultProps } hasUpgradeNudge={ true } /> );

		expect( screen.queryByText( 'Connect Stripe' ) ).not.toBeInTheDocument();
	} );

	test( 'does not display the Stripe button when the site requires an upgrade', () => {
		render( <ToolbarControls { ...defaultProps } shouldUpgrade={ true } /> );

		expect( screen.queryByText( 'Connect Stripe' ) ).not.toBeInTheDocument();
	} );

	test( 'does not display the Stripe button when the site is already connected to Stripe', () => {
		render( <ToolbarControls { ...defaultProps } connected={ true } /> );

		expect( screen.queryByText( 'Connect Stripe' ) ).not.toBeInTheDocument();
	} );
} );
