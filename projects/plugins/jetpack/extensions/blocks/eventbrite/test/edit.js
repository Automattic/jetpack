import { render, screen } from '@testing-library/react';
import { EventbriteEdit } from '../edit';

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
