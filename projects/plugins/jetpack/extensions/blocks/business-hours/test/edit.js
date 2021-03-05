/**
 * @jest-environment jsdom
 */

/**
 * External dependencies
 */
import '@testing-library/jest-dom/extend-expect';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

/**
 * Internal dependencies
 */
import BusinessHours, { defaultLocalization } from '../edit';

describe( 'Business Hours', () => {
	const dayStrings = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
	const defaultDays = dayStrings.map( day => {
		const hours = [ 'Sun', 'Sat' ].includes( day ) ? [] : [ { opening: '09:00', closing: '17:00' } ]
		return {
			name: day,
			hours,
		};
	} );
	const defaultAttributes = {
		days: defaultDays,
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		clientId: 1,
		isSelected: false,
	};

	const originalFetch = window.fetch;

	beforeEach( () => {
		setAttributes.mockClear();
		window.fetch = jest.fn();
	} );

	afterAll( () => {
		window.fetch = originalFetch;
	} );

	test( 'renders the default business hours when not selected', async () => {
		window.fetch.mockReturnValue(
			Promise.resolve( { status: 200, json: () => Promise.resolve( defaultLocalization ) } )
		);

		const propsNotSelected = { ...defaultProps, isSelected: false };
		render( <BusinessHours { ...propsNotSelected } /> );

		expect( window.fetch.mock.calls[0][0] ).toEqual( '/wpcom/v2/business-hours/localized-week?_locale=user' );

		// Displays loading state
		expect( screen.getByText( 'Loading business hours' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Saturday' ) ).not.toBeInTheDocument();

		// Displays rendered default business hours
		await waitFor( () => expect( screen.getByText( 'Monday') ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByText( 'Tuesday') ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByText( 'Wednesday') ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByText( 'Thursday') ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByText( 'Friday') ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByText( 'Saturday') ).toBeInTheDocument() );
		await waitFor( () => expect( screen.getByText( 'Sunday') ).toBeInTheDocument() );
	} );
} );
