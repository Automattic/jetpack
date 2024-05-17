import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SandBox } from '@wordpress/components';
import { NextdoorEdit } from '../edit';
import { parseUrl } from '../utils';

jest.mock( '../utils.js', () => {
	const originalUtils = jest.requireActual( '../utils.js' );
	return {
		...originalUtils,
		parseUrl: jest.fn(),
	};
} );

jest.mock( '@wordpress/components', () => {
	const originalComponents = jest.requireActual( '@wordpress/components' );
	return {
		...originalComponents,
		SandBox: jest.fn(),
	};
} );

jest.mock( '../utils.js', () => ( {
	__esModule: true,
	parseUrl: jest.fn(),
	resizeIframeOnMessage: jest.fn(),
} ) );

describe( 'NextdoorEdit', () => {
	const createErrorNotice = jest.fn();
	const removeAllNotices = jest.fn();
	const setAttributes = jest.fn();

	const defaultProps = {
		attributes: {},
		setAttributes,
		className: '',
		clientId: 1,
		name: 'jetpack/nextdoor',
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
	};

	beforeEach( () => {
		createErrorNotice.mockClear();
		removeAllNotices.mockClear();
		setAttributes.mockClear();
		parseUrl.mockClear();
	} );

	test( 'set undefined url and displays error when invalid url supplied', async () => {
		const user = userEvent.setup();

		const attributes = { url: 'https://facebook.com/invalid-url' };
		render( <NextdoorEdit { ...{ ...defaultProps, attributes } } /> );

		await user.click( screen.getByRole( 'button', { name: 'Embed' } ) );

		expect( removeAllNotices ).toHaveBeenCalled();
		expect( createErrorNotice ).toHaveBeenCalled();
	} );

	test( 'parsed embed code is tested before updating attributes', async () => {
		const user = userEvent.setup();
		render( <NextdoorEdit { ...defaultProps } /> );

		await user.type( screen.getByRole( 'textbox' ), 'https://nextdoor.com/p/valid-url' );
		await user.click( screen.getByRole( 'button', { name: 'Embed' } ) );

		await waitFor( () =>
			expect( parseUrl ).toHaveBeenCalledWith( 'https://nextdoor.com/p/valid-url' )
		);
	} );

	test( 'renders iframe if url is valid', async () => {
		const attributes = { url: 'https://nextdoor.com/p/valid-url' };
		parseUrl.mockImplementation( () => 'https://nextdoor.com/embed/valid-url' );

		render( <NextdoorEdit { ...{ ...defaultProps, attributes } } /> );

		expect( SandBox ).toHaveBeenCalled();

		const callDetails = SandBox.mock.calls[ 0 ][ 0 ];

		expect( callDetails ).toHaveProperty( 'html' );
		expect( callDetails.html ).toContain( 'src="https://nextdoor.com/embed/valid-url"' );
	} );
} );
