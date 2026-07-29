/**
 * Tests for the experimental Newsletter Mode toggle in settings.
 *
 * `@wordpress/ui` and `@wordpress/dataviews` are stubbed to plain HTML so the
 * tests exercise the section's own state, REST call, and notices.
 */

const mockCreateNotice = jest.fn();
const mockGetNewsletterScriptData = jest.fn();
const mockUpdateNewsletterMode = jest.fn< Promise< boolean >, [ boolean ] >();
const mockDataFormProps: { current: ModeDataFormProps | null } = { current: null };

type ModeDataFormProps = {
	data: { newsletter_mode_enabled: boolean };
	fields: Array< { id: string; label: string; description?: string } >;
	onChange: ( updates: Record< string, unknown > ) => void;
};

jest.mock( '@wordpress/data', () => ( {
	useDispatch: () => ( { createNotice: mockCreateNotice } ),
} ) );

jest.mock( '@wordpress/notices', () => ( {
	store: 'notices',
} ) );

jest.mock( '@wordpress/ui', () => ( {
	__esModule: true,
	Card: {
		Root: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Header: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
		Title: ( { children }: { children: React.ReactNode } ) => <h2>{ children }</h2>,
		Content: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
	},
	Fieldset: {
		Root: ( { children, disabled }: { children: React.ReactNode; disabled?: boolean } ) => (
			<fieldset disabled={ disabled } data-testid="mode-fieldset">
				{ children }
			</fieldset>
		),
	},
	Stack: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '@wordpress/dataviews', () => ( {
	__esModule: true,
	DataForm: ( props: ModeDataFormProps ) => {
		const field = props.fields[ 0 ];
		mockDataFormProps.current = props;

		return (
			<label htmlFor="newsletter-mode-enabled">
				{ field.label }
				<input
					id="newsletter-mode-enabled"
					type="checkbox"
					checked={ props.data.newsletter_mode_enabled }
					// Test-only mock: rebinding is fine and keeps the mock readable.
					// eslint-disable-next-line react/jsx-no-bind
					onChange={ event => props.onChange( { [ field.id ]: event.currentTarget.checked } ) }
				/>
				<span>{ field.description }</span>
			</label>
		);
	},
} ) );

jest.mock( '../src/settings/mode-api', () => ( {
	updateNewsletterMode: ( enabled: boolean ) => mockUpdateNewsletterMode( enabled ),
} ) );

jest.mock( '../src/settings/script-data', () => ( {
	getNewsletterScriptData: () => mockGetNewsletterScriptData(),
} ) );

import { act, render, screen, waitFor } from '@testing-library/react';
import { NewsletterModeSection } from '../src/settings/sections/newsletter-mode-section';

describe( 'NewsletterModeSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockDataFormProps.current = null;
		mockGetNewsletterScriptData.mockReturnValue( { modeEnabled: false } );
		mockUpdateNewsletterMode.mockResolvedValue( true );
	} );

	it( 'seeds the toggle from the bootstrapped mode state', () => {
		mockGetNewsletterScriptData.mockReturnValue( { modeEnabled: true } );

		render( <NewsletterModeSection /> );

		expect(
			screen.getByRole( 'checkbox', { name: /Enable experimental Newsletter Mode/ } )
		).toBeChecked();
		expect(
			screen.getByText(
				'Turn the Newsletter page into a focused, distraction-free workspace. Changes apply the next time the page loads.'
			)
		).toBeInTheDocument();
	} );

	it( 'persists a toggle change and shows the success notice', async () => {
		let resolveUpdate: ( value: boolean ) => void;
		mockUpdateNewsletterMode.mockReturnValue(
			new Promise< boolean >( resolve => {
				resolveUpdate = resolve;
			} )
		);

		render( <NewsletterModeSection /> );

		const toggle = screen.getByRole( 'checkbox', {
			name: /Enable experimental Newsletter Mode/,
		} );

		act( () => {
			mockDataFormProps.current?.onChange( { newsletter_mode_enabled: true } );
		} );

		expect( mockUpdateNewsletterMode ).toHaveBeenCalledWith( true );
		expect( toggle ).toBeChecked();
		expect( screen.getByTestId( 'mode-fieldset' ) ).toBeDisabled();

		await act( async () => {
			resolveUpdate( true );
		} );

		await waitFor( () => {
			expect( screen.getByTestId( 'mode-fieldset' ) ).toBeEnabled();
		} );
		expect( mockCreateNotice ).toHaveBeenCalledWith(
			'success',
			'Newsletter Mode updated. Reload the page to see the change.',
			{ type: 'snackbar' }
		);
	} );

	it( 'reverts the optimistic state and shows an error notice when saving fails', async () => {
		const consoleError = jest.spyOn( console, 'error' ).mockImplementation( () => undefined );
		mockGetNewsletterScriptData.mockReturnValue( { modeEnabled: true } );
		mockUpdateNewsletterMode.mockRejectedValue( new Error( 'No changes allowed.' ) );

		render( <NewsletterModeSection /> );

		await act( async () => {
			mockDataFormProps.current?.onChange( { newsletter_mode_enabled: false } );
		} );

		await waitFor( () => {
			expect( mockCreateNotice ).toHaveBeenCalledWith( 'error', 'No changes allowed.', {
				type: 'snackbar',
				explicitDismiss: true,
			} );
		} );
		expect(
			screen.getByRole( 'checkbox', { name: /Enable experimental Newsletter Mode/ } )
		).toBeChecked();

		consoleError.mockRestore();
	} );

	it( 'ignores DataForm updates that are not boolean toggle changes', () => {
		render( <NewsletterModeSection /> );

		act( () => {
			mockDataFormProps.current?.onChange( { newsletter_mode_enabled: 'yes' } );
		} );

		expect( mockUpdateNewsletterMode ).not.toHaveBeenCalled();
		expect(
			screen.getByRole( 'checkbox', { name: /Enable experimental Newsletter Mode/ } )
		).not.toBeChecked();
	} );
} );
