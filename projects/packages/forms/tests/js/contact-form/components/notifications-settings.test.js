/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
/**
 * Internal dependencies
 */
import NotificationsSettings from '../../../../src/blocks/contact-form/components/notifications-settings';

// Create stable handlers outside of mock to avoid react/jsx-no-bind issues
const createToggleHandler = onChange => {
	return e => {
		onChange( e.target.checked );
	};
};

const createTokenFieldHandler = ( onChange, value ) => {
	return e => {
		// Simulate selecting a user from suggestions
		const selectedName = e.target.value;
		const currentValues = value.length > 0 ? value : [];
		onChange( [ ...currentValues, selectedName ] );
	};
};

const createClearHandler = onChange => {
	return () => onChange( [] );
};

// Mock WordPress components
jest.mock( '@wordpress/components', () => {
	/**
	 * Mock ToggleControl component.
	 *
	 * @param {object}   root0          - Component props
	 * @param {string}   root0.label    - Label text
	 * @param {boolean}  root0.checked  - Checked state
	 * @param {Function} root0.onChange - Change handler
	 * @return {object} React element
	 */
	function ToggleControlComponent( { label, checked, onChange } ) {
		return (
			<label htmlFor="toggle-control">
				{ label }
				<input
					id="toggle-control"
					type="checkbox"
					checked={ checked }
					onChange={ createToggleHandler( onChange ) }
				/>
			</label>
		);
	}

	/**
	 * Mock FormTokenField component.
	 *
	 * @param {object}   root0             - Component props
	 * @param {string}   root0.label       - Label text
	 * @param {Array}    root0.value       - Current values
	 * @param {Array}    root0.suggestions - Available suggestions
	 * @param {Function} root0.onChange    - Change handler
	 * @return {object} React element
	 */
	function FormTokenFieldComponent( { label, value, suggestions, onChange } ) {
		return (
			<div data-testid="form-token-field">
				<label htmlFor="token-field">{ label }</label>
				<input
					id="token-field"
					type="text"
					value={ value.join( ', ' ) }
					data-suggestions={ JSON.stringify( suggestions ) }
					onChange={ createTokenFieldHandler( onChange, value ) }
				/>
				<button data-testid="clear-all-button" onClick={ createClearHandler( onChange ) }>
					Clear All
				</button>
			</div>
		);
	}

	/**
	 * Mock ExternalLink component.
	 *
	 * @param {object} root0          - Component props
	 * @param {string} root0.href     - Link URL
	 * @param {*}      root0.children - Child elements
	 * @return {object} React element
	 */
	function ExternalLinkComponent( { href, children } ) {
		return (
			<a href={ href } target="_blank" rel="noopener noreferrer">
				{ children }
			</a>
		);
	}

	return {
		ToggleControl: ToggleControlComponent,
		FormTokenField: FormTokenFieldComponent,
		ExternalLink: ExternalLinkComponent,
	};
} );

// Mock WordPress i18n
jest.mock( '@wordpress/i18n', () => ( {
	__: jest.fn( text => text ),
} ) );

// Mock WordPress element
jest.mock( '@wordpress/element', () => ( {
	...jest.requireActual( '@wordpress/element' ),
	createInterpolateElement: jest.fn( text => {
		// Simple mock that returns the text with link component
		return <span>{ text }</span>;
	} ),
} ) );

// Mock WordPress data
jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( callback => {
		const mockSelect = store => {
			if ( store === 'core' ) {
				return {
					getUsers: () => [
						{ id: 1, name: 'Admin User', capabilities: { edit_posts: true } },
						{ id: 2, name: 'Editor User', capabilities: { edit_pages: true } },
						{ id: 3, name: 'Author User', capabilities: {} },
					],
				};
			}
			if ( store === 'core/editor' ) {
				return {
					getEditedPostAttribute: attr => {
						if ( attr === 'author' ) {
							return 1;
						}
						return null;
					},
				};
			}
			return {};
		};
		return callback( mockSelect );
	} ),
} ) );

// Mock core-data store
jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

// Mock editor store
jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

// Mock InspectorHint component
jest.mock( '../../../../src/blocks/shared/components/inspector-hint', () => ( { children } ) => (
	<div data-testid="inspector-hint">{ children }</div>
) );

// Mock JetpackEmailConnectionSettings component
jest.mock(
	'../../../../src/blocks/contact-form/components/jetpack-email-connection-settings',
	() =>
		( { emailNotifications } ) =>
			emailNotifications ? <div data-testid="email-settings">Email Settings</div> : null
);

// Mock Jetpack shared extension utils
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: jest.fn( () => true ),
} ) );

// Mock Jetpack script data
jest.mock( '@automattic/jetpack-script-data', () => ( {
	isWpcomPlatformSite: jest.fn( () => false ),
} ) );

describe( 'NotificationsSettings', () => {
	let setAttributesMock;

	// Default props for the component
	const defaultProps = {
		emailAddress: '',
		emailSubject: '',
		emailNotifications: true,
		instanceId: 1,
		postAuthorEmail: 'admin@example.com',
	};

	beforeEach( () => {
		setAttributesMock = jest.fn();
		jest.clearAllMocks();
	} );

	it( 'renders the toggle control', () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [] }
				{ ...defaultProps }
			/>
		);

		expect( screen.getByText( 'Enable notifications for responses' ) ).toBeInTheDocument();
	} );

	it( 'does not show user selector when toggle is disabled', () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [] }
				{ ...defaultProps }
			/>
		);

		expect( screen.queryByTestId( 'form-token-field' ) ).not.toBeInTheDocument();
	} );

	it( 'shows user selector when toggle is enabled', async () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [] }
				{ ...defaultProps }
			/>
		);

		const toggle = screen.getByRole( 'checkbox' );
		await userEvent.click( toggle );

		expect( screen.getByTestId( 'form-token-field' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Send notifications to' ) ).toBeInTheDocument();
	} );

	it( 'auto-selects post author when toggle is enabled with no recipients', async () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [] }
				{ ...defaultProps }
			/>
		);

		const toggle = screen.getByRole( 'checkbox' );
		await userEvent.click( toggle );

		// Should auto-select the post author (user ID 1)
		expect( setAttributesMock ).toHaveBeenCalledWith( {
			notificationRecipients: [ '1' ],
		} );
	} );

	it( 'preserves existing recipients when component is initialized with them', () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [ '2' ] }
				{ ...defaultProps }
			/>
		);

		// Toggle should be checked because recipients exist
		const toggle = screen.getByRole( 'checkbox' );
		expect( toggle ).toBeChecked();

		// User selector should be visible
		expect( screen.getByTestId( 'form-token-field' ) ).toBeInTheDocument();
	} );

	it( 'clears recipients when toggle is disabled', async () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [ '1', '2' ] }
				{ ...defaultProps }
			/>
		);

		// Toggle is initially on because recipients exist
		const toggle = screen.getByRole( 'checkbox' );
		await userEvent.click( toggle );

		expect( setAttributesMock ).toHaveBeenCalledWith( {
			notificationRecipients: [],
		} );
	} );

	it( 'filters users to only show those with edit capabilities', () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [ '1' ] }
				{ ...defaultProps }
			/>
		);

		const input = screen.getByRole( 'textbox' );
		const suggestionsAttr = input.getAttribute( 'data-suggestions' );
		const suggestions = JSON.parse( suggestionsAttr );

		// Should only include Admin User and Editor User, not Author User
		expect( suggestions ).toHaveLength( 2 );
		expect( suggestions ).toContain( 'Admin User' );
		expect( suggestions ).toContain( 'Editor User' );
		expect( suggestions ).not.toContain( 'Author User' );
	} );

	it( 'displays selected users by name', () => {
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [ '1', '2' ] }
				{ ...defaultProps }
			/>
		);

		const input = screen.getByRole( 'textbox' );

		// Should display user names, not IDs
		expect( input.value ).toContain( 'Admin User' );
		expect( input.value ).toContain( 'Editor User' );
	} );

	it( 'defaults to post author when all recipients are removed', async () => {
		// Start with Editor User as recipient
		render(
			<NotificationsSettings
				setAttributes={ setAttributesMock }
				notificationRecipients={ [ '2' ] }
				{ ...defaultProps }
			/>
		);

		// User selector should be visible with Editor User selected
		const input = screen.getByRole( 'textbox' );
		expect( input.value ).toContain( 'Editor User' );

		// Clear all recipients by clicking the clear button
		const clearButton = screen.getByTestId( 'clear-all-button' );
		await userEvent.click( clearButton );

		// Should auto-select the post author (user ID 1) when field is cleared
		expect( setAttributesMock ).toHaveBeenCalledWith( {
			notificationRecipients: [ '1' ],
		} );
	} );
} );
