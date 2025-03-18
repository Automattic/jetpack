import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBoxControl, { getDefaultLabel, getPlaceholderText } from '../';

const mockRecordEvent = jest.fn();
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( {
		recordEvent: mockRecordEvent,
	} ),
} ) );

describe( 'MessageBoxControl', () => {
	const mockOnChange = jest.fn();
	const mockMessage = 'Test message';
	const mockMaxLength = 100;
	const mockAnalyticsData = { location: 'test-location' };

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'renders with the provided message', () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
			/>
		);

		expect( screen.getByLabelText( getDefaultLabel() ) ).toHaveValue( mockMessage );
	} );

	it( 'displays correct remaining character count', () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
			/>
		);

		const remainingChars = mockMaxLength - mockMessage.length;
		expect( screen.getByText( `${ remainingChars } characters remaining` ) ).toBeInTheDocument();
	} );

	it( 'calls onChange when text is modified', async () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
			/>
		);

		const textArea = screen.getByLabelText( getDefaultLabel() );
		await userEvent.type( textArea, ' additional text' );

		expect( mockOnChange ).toHaveBeenCalled();
	} );

	it( 'records analytics event on first change only', async () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
				analyticsData={ mockAnalyticsData }
			/>
		);

		const textArea = screen.getByLabelText( getDefaultLabel() );
		await userEvent.type( textArea, ' first change' );
		await userEvent.type( textArea, ' second change' );

		expect( mockRecordEvent ).toHaveBeenCalledTimes( 1 );
		expect( mockRecordEvent ).toHaveBeenCalledWith(
			'jetpack_social_custom_message_changed',
			mockAnalyticsData
		);
	} );

	it( 'does record analytics event when analyticsData is null', async () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
			/>
		);

		const textArea = screen.getByLabelText( getDefaultLabel() );
		await userEvent.type( textArea, ' additional text' );

		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_custom_message_changed', null );
	} );

	it( 'disables the textarea when disabled prop is true', () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
				disabled={ true }
			/>
		);

		expect( screen.getByLabelText( getDefaultLabel() ) ).toBeDisabled();
	} );

	it( 'enforces maxLength character limit', () => {
		const shortMaxLength = 15;
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ shortMaxLength }
			/>
		);

		const textArea = screen.getByLabelText( getDefaultLabel() );
		expect( textArea ).toHaveAttribute( 'maxLength', shortMaxLength.toString() );
	} );

	it( 'shows correct placeholder text', () => {
		render(
			<MessageBoxControl message="" onChange={ mockOnChange } maxLength={ mockMaxLength } />
		);

		const textArea = screen.getByPlaceholderText( getPlaceholderText() );
		expect( textArea ).toBeInTheDocument();
	} );
} );
