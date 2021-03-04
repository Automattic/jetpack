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
import BusinessHours from '../edit';

describe( '', () => {
	const dayStrings = [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ];
	const defaultDays = dayStrings.map( day => {
		return {
			name: day,
			hours: day in [ 'Sun', 'Sat' ] ? [] : [ { opening: '09:00', closing: '17:00' } ],
		};
	} );
	const defaultAttributes = {
		days: defaultDays
	};

	const setAttributes = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		setAttributes,
		clientId: 1,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders the default business hours when not selected', () => {
		render( <BusinessHours { ...defaultProps } /> );
		expect( screen.getByText( 'Saturday' ) ).toBeInTheDocument();
	} );
} );
