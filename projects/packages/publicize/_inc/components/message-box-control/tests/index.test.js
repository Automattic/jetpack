import { getScriptData, siteHasFeature } from '@automattic/jetpack-script-data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MessageBoxControl, {
	getDefaultLabel,
	getPlaceholderText,
	getTemplatesPlaceholderText,
} from '../';

const mockRecordEvent = jest.fn();
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( {
		recordEvent: mockRecordEvent,
	} ),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	siteHasFeature: jest.fn().mockReturnValue( false ),
	getScriptData: jest.fn().mockReturnValue( {} ),
} ) );

const mockPlaceholders = [
	{ id: '{title}', label: 'Post title' },
	{ id: '{url}', label: 'Permalink to the post' },
	{ id: '{tags}', label: 'Post tags as hashtags' },
];

describe( 'MessageBoxControl', () => {
	const mockOnChange = jest.fn();
	const mockMessage = 'Test message';
	const mockMaxLength = 100;
	const mockAnalyticsData = { location: 'test-location' };

	beforeEach( () => {
		jest.clearAllMocks();
		siteHasFeature.mockReturnValue( false );
		getScriptData.mockReturnValue( {
			social: { message_templates: { placeholders: mockPlaceholders } },
		} );
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

	it( 'shows the default placeholder text when templates feature is off', () => {
		render(
			<MessageBoxControl message="" onChange={ mockOnChange } maxLength={ mockMaxLength } />
		);

		const textArea = screen.getByPlaceholderText( getPlaceholderText() );
		expect( textArea ).toBeInTheDocument();
	} );

	it( 'does not show the placeholders help when templates feature is off', () => {
		render(
			<MessageBoxControl message="" onChange={ mockOnChange } maxLength={ mockMaxLength } />
		);

		expect(
			screen.queryByRole( 'button', { name: 'Available placeholders' } )
		).not.toBeInTheDocument();
	} );

	it( 'uses explicit help text when provided', () => {
		render(
			<MessageBoxControl
				message={ mockMessage }
				onChange={ mockOnChange }
				maxLength={ mockMaxLength }
				help="Custom help text"
			/>
		);

		expect( screen.getByText( 'Custom help text' ) ).toBeInTheDocument();
		expect( screen.queryByText( /characters remaining/ ) ).not.toBeInTheDocument();
		expect( screen.queryByText( /character remaining/ ) ).not.toBeInTheDocument();
	} );

	describe( 'when templates feature is on', () => {
		beforeEach( () => {
			siteHasFeature.mockReturnValue( true );
		} );

		it( 'shows the templates-aware placeholder text', () => {
			render(
				<MessageBoxControl message="" onChange={ mockOnChange } maxLength={ mockMaxLength } />
			);

			const textArea = screen.getByPlaceholderText( getTemplatesPlaceholderText() );
			expect( textArea ).toBeInTheDocument();
		} );

		it( 'shows the placeholders help toggle', () => {
			render(
				<MessageBoxControl message="" onChange={ mockOnChange } maxLength={ mockMaxLength } />
			);

			expect(
				screen.getByRole( 'button', { name: 'Available placeholders' } )
			).toBeInTheDocument();
		} );

		it( 'reveals the placeholder list when toggle is clicked', async () => {
			render(
				<MessageBoxControl message="" onChange={ mockOnChange } maxLength={ mockMaxLength } />
			);

			await userEvent.click( screen.getByRole( 'button', { name: 'Available placeholders' } ) );

			// Scope queries to the popover-rendered list — `{title}` and `{url}`
			// also appear in the textarea help text via createInterpolateElement.
			const list = screen.getByRole( 'list' );
			expect( within( list ).getByText( '{title}' ) ).toBeInTheDocument();
			expect( within( list ).getByText( '{url}' ) ).toBeInTheDocument();
			expect( within( list ).getByText( '{tags}' ) ).toBeInTheDocument();
		} );

		it( 'still respects an explicit placeholder prop', () => {
			render(
				<MessageBoxControl
					message=""
					onChange={ mockOnChange }
					maxLength={ mockMaxLength }
					placeholder="Custom placeholder"
				/>
			);

			expect( screen.getByPlaceholderText( 'Custom placeholder' ) ).toBeInTheDocument();
		} );

		it( 'does not enforce a maxLength on the textarea', () => {
			render(
				<MessageBoxControl
					message={ mockMessage }
					onChange={ mockOnChange }
					maxLength={ mockMaxLength }
				/>
			);

			expect( screen.getByLabelText( getDefaultLabel() ) ).not.toHaveAttribute( 'maxLength' );
		} );

		it( 'does not show the characters-remaining counter', () => {
			render(
				<MessageBoxControl
					message={ mockMessage }
					onChange={ mockOnChange }
					maxLength={ mockMaxLength }
				/>
			);

			expect( screen.queryByText( /characters remaining/ ) ).not.toBeInTheDocument();
			expect( screen.queryByText( /character remaining/ ) ).not.toBeInTheDocument();
		} );

		it( 'uses explicit help text when provided', () => {
			render(
				<MessageBoxControl
					message={ mockMessage }
					onChange={ mockOnChange }
					maxLength={ mockMaxLength }
					help="Custom help text"
				/>
			);

			expect( screen.getByText( 'Custom help text' ) ).toBeInTheDocument();
		} );
	} );
} );
