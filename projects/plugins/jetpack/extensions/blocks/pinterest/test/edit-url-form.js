import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditUrlForm from '../components/edit-url-form';

describe( 'EditUrlForm', () => {
	const onSubmit = jest.fn();
	const setUrl = jest.fn();
	const defaultProps = {
		className: 'blame-it-on-the-enchiladas',
		onSubmit,
		setUrl,
		noticeUI: [ <p key="hi">hi!</p> ],
		url: 'https://get.your/art/to-mars',
	};

	beforeEach( () => {
		onSubmit.mockClear();
		setUrl.mockClear();
	} );

	test( 'should render', () => {
		render( <EditUrlForm { ...defaultProps } /> );
		const { container } = render( <EditUrlForm { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		expect( container.querySelector( 'div' ).className ).toContain( defaultProps.className );
	} );

	test( 'defaults value to url', () => {
		render( <EditUrlForm { ...defaultProps } /> );

		expect( screen.getByLabelText( 'Pinterest URL' ).value ).toEqual( defaultProps.url );
	} );

	test( 'calls onSubmit when submitting form', () => {
		const { container } = render( <EditUrlForm { ...defaultProps } /> );
		// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
		const form = container.querySelector( 'form' );
		fireEvent.submit( form );

		expect( onSubmit ).toHaveBeenCalled();
	} );

	test( 'calls setUrl when updating input field', async () => {
		const user = userEvent.setup();
		render( <EditUrlForm { ...defaultProps } /> );
		await user.type( screen.getByLabelText( 'Pinterest URL' ), 'blah' );

		expect( setUrl ).toHaveBeenCalledTimes( 4 );
	} );
} );
