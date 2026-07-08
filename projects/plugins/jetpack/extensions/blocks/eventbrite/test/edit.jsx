import { render, screen } from '@testing-library/react';
import { EventbriteEdit } from '../edit';

// Mock @automattic/jetpack-script-data functions to allow isWpcomPlatformSite to be correctly used.
jest.mock( '@automattic/jetpack-script-data', () => {
	const isWpcomPlatformSite = jest.fn().mockReturnValue( false );
	return {
		isWpcomPlatformSite,
	};
} );

describe( 'Eventbrite Edit', () => {
	const defaultAttributes = {
		url: '',
	};

	const setAttributes = jest.fn();
	const removeAllNotices = jest.fn();
	const createErrorNotice = jest.fn();
	const defaultProps = {
		attributes: defaultAttributes,
		noticeOperations: {
			removeAllNotices,
			createErrorNotice,
		},
		setAttributes,
	};

	beforeEach( () => {
		setAttributes.mockClear();
	} );

	test( 'renders form by default', () => {
		render( <EventbriteEdit { ...defaultProps } /> );

		expect(
			screen.getByPlaceholderText( 'Enter an event URL to embed here…' )
		).toBeInTheDocument();
	} );
} );
