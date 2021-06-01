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
import ErrorNotice from '../components/error-notice';

jest.mock( '@wordpress/blocks', () => ( {
	createBlock: ( blockName, contentObj ) => ( { blockName, contentObj  } ),
} ) );

describe( 'ErrorNotice', () => {
	const onClick = jest.fn();

	const defaultProps = {
		onClick,
		fallbackUrl: 'https://rain.drops/keep/falling'
	};

	beforeEach( () => {
		onClick.mockClear();
	} );

	test( 'calls onClick when clicking button', () => {
		render( <ErrorNotice { ...defaultProps } /> );
		userEvent.click( screen.getByText( 'Convert block to link' ) );
		expect( onClick ).toHaveBeenCalledWith( {
			blockName: 'core/paragraph',
			contentObj: {
				content: `<a href="${ defaultProps.fallbackUrl }">${ defaultProps.fallbackUrl }</a>`
			},
		} );
	} );
} );
