import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEntityProp } from '@wordpress/core-data';
import * as wpData from '@wordpress/data';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { DEFAULT_FONTSIZE_VALUE } from '../constants';
import SubscriptionsInspectorControls from '../controls';

// `@wordpress/core-data` exposes its exports as non-configurable bindings, so
// `jest.spyOn(wpCoreData, 'useEntityProp')` fails with "Cannot redefine
// property". Mock the two exports the component actually uses (the `store`
// reference is only passed to selectors inside a `useSelect` callback, which
// we override via the spy below, so a stub value is fine here).
jest.mock( '@wordpress/core-data', () => ( {
	__esModule: true,
	store: 'core',
	useEntityProp: jest.fn( () => [ undefined, () => {} ] ),
} ) );

// These settings need to be set. Easiest way to do that seems to be to use a hook.
const overrideSettings = {
	'typography.customFontSize': true,
	'color.defaultGradients': true,
	'color.defaultPalette': true,
	'color.palette.default': [ { name: 'White', slug: 'white', color: '#ffffff' } ],
	'color.gradients.default': [
		{
			name: 'Monochrome',
			gradient: 'linear-gradient(135deg,rgb(0,0,0) 0%,rgb(255,255,255) 100%)',
			slug: 'monochrome',
		},
	],
};
beforeAll( () => {
	addFilter(
		'blockEditor.useSetting.before',
		'extensions/blocks/button/test/controls',
		( value, path ) => {
			if ( Object.hasOwn( overrideSettings, path ) ) {
				return overrideSettings[ path ];
			}
			return value;
		}
	);
} );
afterAll( () => {
	removeFilter( 'blockEditor.useSetting.before', 'extensions/blocks/button/test/controls' );
} );

jest.mock( '@wordpress/notices', () => {}, { virtual: true } );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	__esModule: true,
	...jest.requireActual( '@automattic/jetpack-shared-extension-utils' ),
	useModuleStatus: jest.fn().mockReturnValue( {
		isModuleActive: true,
		isLoadingModules: false,
		isChangingStatus: false,
		changeStatus: jest.fn(),
	} ),
} ) );

// Mock @automattic/jetpack-script-data functions to allow isSimpleSite to be correctly used.
jest.mock( '@automattic/jetpack-script-data', () => {
	const isSimpleSite = jest.fn().mockReturnValue( false );
	return {
		isSimpleSite,
	};
} );

const setButtonBackgroundColor = jest.fn();
const setGradient = jest.fn();
const setTextColor = jest.fn();
const setAttributes = jest.fn();

const defaultProps = {
	buttonBackgroundColor: { color: '#000000' },
	borderColor: { color: '#000000' },
	buttonGradient: {
		buttonGradient: 10,
		setGradient,
	},
	borderRadius: 0,
	borderWeight: 0,
	buttonOnNewLine: false,
	emailFieldBackgroundColor: { color: '#000000' },
	fallbackButtonBackgroundColor: '#000000',
	fallbackTextColor: '#000000',
	fontSize: DEFAULT_FONTSIZE_VALUE,
	isGradientAvailable: true,
	padding: 0,
	setAttributes,
	setButtonBackgroundColor,
	setTextColor,
	showSubscribersTotal: true,
	spacing: 0,
	subscriberCount: 100,
	textColor: '#000000',
	areNewsletterCategoriesEnabled: true,
	availableNewsletterCategories: [
		{ id: 1, name: 'Category 1' },
		{ id: 2, name: 'Category 2' },
	],
	preselectNewsletterCategories: false,
	selectedNewsletterCategoryIds: [],
};

const setSubscriptionOptions = jest.fn();
let useSelectSpy;

/**
 * Make the Subscribe message control's `canUser('update','settings')` call
 * resolve to `value`. All other `useSelect` callsites in the render tree
 * still fall through to the real implementation.
 *
 * @param {boolean|undefined} value - Value the canUser selector should return.
 */
function mockCanEditSiteSettings( value ) {
	const realUseSelect = jest.requireActual( '@wordpress/data' ).useSelect;
	useSelectSpy.mockImplementation( ( mapSelect, deps ) => {
		const fnStr = typeof mapSelect === 'function' ? mapSelect.toString() : '';
		if ( fnStr.includes( 'canUser' ) ) {
			return value;
		}
		return realUseSelect( mapSelect, deps );
	} );
}

/**
 * Make `useEntityProp('root','site','subscription_options')` return `value`
 * plus the `setSubscriptionOptions` mock setter.
 *
 * @param {object|undefined} value - Value the hook should return.
 */
function mockSubscriptionOptions( value ) {
	useEntityProp.mockImplementation( () => [ value, setSubscriptionOptions ] );
}

beforeEach( () => {
	setAttributes.mockClear();
	setGradient.mockClear();
	setTextColor.mockClear();
	setButtonBackgroundColor.mockClear();
	setSubscriptionOptions.mockClear();
	useSelectSpy = jest.spyOn( wpData, 'useSelect' );
	// Default to "loading"/empty so existing tests (which never exercise the
	// new control) keep behaving as if the gated branch is hidden.
	mockCanEditSiteSettings( undefined );
	mockSubscriptionOptions( undefined );
} );

afterEach( () => {
	jest.restoreAllMocks();
} );

describe( 'Inspector controls', () => {
	describe( 'Gradient settings panel', () => {
		test( 'displays gradient settings control panel', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Color' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Background Colors' ) ).not.toBeInTheDocument();
		} );

		test( 'sets solid background color', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Button Background', { ignore: '[aria-hidden=true]' } ) );
			// eslint-disable-next-line testing-library/no-node-access
			const popoverContainer = document.querySelector( '.components-popover__fallback-container' );
			await user.click( within( popoverContainer ).getByRole( 'tab', { name: 'Color' } ) );
			await user.click(
				within( popoverContainer ).getAllByRole( 'option', { name: /White/ } )[ 0 ]
			);

			expect( setButtonBackgroundColor.mock.calls[ 0 ][ 0 ] ).toMatch( /#[a-z0-9]{6,6}/ );
		} );
	} );

	describe( 'Color settings panel', () => {
		test( 'hides gradient settings control panel', () => {
			render(
				<SubscriptionsInspectorControls { ...defaultProps } isGradientAvailable={ false } />
			);

			expect( screen.getByText( 'Background Colors' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Color Settings' ) ).not.toBeInTheDocument();
		} );

		test( 'sets gradient background color', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Button Background', { ignore: '[aria-hidden=true]' } ) );
			await user.click( screen.getByText( 'Gradient', { ignore: '[aria-hidden=true]' } ) );
			await user.click( screen.queryAllByLabelText( /Gradient:/i, { selector: 'button' } )[ 0 ] );

			expect( setGradient.mock.calls[ 0 ][ 0 ] ).toMatch( /linear-gradient\((.+)\)/ );
		} );
	} );

	describe( 'Typography panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Typography' ) ).toBeInTheDocument();
		} );

		test( 'set custom text', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByRole( 'button', { name: 'Typography' } ) );
			await user.click( screen.getByRole( 'button', { name: 'Set custom size' } ) );
			await user.type( screen.getByRole( 'spinbutton', { name: 'Font size' } ), '18' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				fontSize: 18,
				customFontSize: 18,
			} );
		} );
	} );

	describe( 'Border settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Border', { selector: 'button' } ) ).toBeInTheDocument();
		} );

		test( 'set border radius', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Border', { selector: 'button' } ) );
			const rangeControlElement = screen.getAllByLabelText( 'Border Radius' )[ 1 ];
			await user.clear( rangeControlElement );
			await user.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				borderRadius: 5,
			} );
		} );

		test( 'set border weight', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Border', { selector: 'button' } ) );
			const rangeControlElement = screen.getAllByLabelText( 'Border Weight' )[ 1 ];
			await user.clear( rangeControlElement );
			await user.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				borderWeight: 5,
			} );
		} );
	} );

	describe( 'Spacing settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );

			expect( screen.getByText( 'Spacing' ) ).toBeInTheDocument();
		} );

		test( 'set space inside', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Spacing' ), { selector: 'button' } );
			const rangeControlElement = screen.getAllByLabelText( 'Space Inside' )[ 1 ];
			await user.clear( rangeControlElement );
			await user.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				padding: 5,
			} );
		} );

		test( 'set space between', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Spacing' ), { selector: 'button' } );
			const rangeControlElement = screen.getAllByLabelText( 'Space Between' )[ 1 ];
			await user.clear( rangeControlElement );
			await user.type( rangeControlElement, '5' );

			expect( setAttributes ).toHaveBeenLastCalledWith( {
				spacing: 5,
			} );
		} );

		test( 'toggles place button on new line if width set to 100%', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Spacing' ), { selector: 'button' } );
			await user.click( screen.getByLabelText( '100%' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonWidth: '100%',
				buttonOnNewLine: true,
			} );
		} );

		test( 'toggles place button on new line if width set to 50%', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Spacing' ), { selector: 'button' } );
			await user.click( screen.getByLabelText( '50%' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonWidth: '50%',
				buttonOnNewLine: false,
			} );
		} );

		test( 'Does not toggle place button on new line if width set to 50% and new line setting enabled', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } buttonOnNewLine={ true } /> );
			await user.click( screen.getByText( 'Spacing' ), { selector: 'button' } );
			await user.click( screen.getByLabelText( '50%' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonWidth: '50%',
				buttonOnNewLine: true,
			} );
		} );
	} );

	describe( 'Display settings panel', () => {
		test( 'displays correctly', () => {
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			expect( screen.getByText( 'Settings' ) ).toBeInTheDocument();
		} );

		test( 'toggles subscriber count', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );
			await user.click( screen.getByLabelText( 'Show subscriber count' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				includeSocialFollowers: false,
				showSubscribersTotal: false,
			} );
		} );

		test( 'toggles include social followers', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );
			await user.click( screen.getByLabelText( 'Include social followers in count' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				includeSocialFollowers: false,
			} );
		} );

		test( 'toggles place button on new line', async () => {
			const user = userEvent.setup();
			render( <SubscriptionsInspectorControls { ...defaultProps } /> );
			await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );
			await user.click( screen.getByLabelText( 'Place button on new line' ) );

			expect( setAttributes ).toHaveBeenCalledWith( {
				buttonOnNewLine: true,
			} );
		} );

		describe( 'Pre-select newsletter categories', () => {
			test( 'displays newsletter category controls when enabled', async () => {
				const user = userEvent.setup();
				render( <SubscriptionsInspectorControls { ...defaultProps } /> );

				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				expect( screen.getByText( 'Pre-select categories' ) ).toBeInTheDocument();
			} );

			test( 'does not render controls when newsletter categories are disabled', async () => {
				const user = userEvent.setup();
				render(
					<SubscriptionsInspectorControls
						{ ...defaultProps }
						areNewsletterCategoriesEnabled={ false }
					/>
				);

				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				expect( screen.queryByText( 'Pre-select categories' ) ).not.toBeInTheDocument();
				expect( screen.queryByText( 'Categories' ) ).not.toBeInTheDocument();
			} );

			test( 'does not render controls when there are no categories', async () => {
				const user = userEvent.setup();
				render(
					<SubscriptionsInspectorControls
						{ ...defaultProps }
						availableNewsletterCategories={ [] }
					/>
				);

				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				expect( screen.queryByText( 'Pre-select categories' ) ).not.toBeInTheDocument();
				expect( screen.queryByText( 'Categories' ) ).not.toBeInTheDocument();
			} );

			test( 'selects categories', async () => {
				const user = userEvent.setup();
				render(
					<SubscriptionsInspectorControls { ...defaultProps } preselectNewsletterCategories />
				);

				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );
				await user.click( screen.getByLabelText( 'Category 1' ) );

				expect( setAttributes ).toHaveBeenCalledWith( {
					selectedNewsletterCategoryIds: [ defaultProps.availableNewsletterCategories[ 0 ].id ],
				} );
			} );

			test( 'toggles category selection', async () => {
				const user = userEvent.setup();
				render(
					<SubscriptionsInspectorControls
						{ ...defaultProps }
						preselectNewsletterCategories
						selectedNewsletterCategoryIds={ [
							defaultProps.availableNewsletterCategories[ 0 ].id,
							defaultProps.availableNewsletterCategories[ 1 ].id,
						] }
					/>
				);

				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );
				await user.click( screen.getByLabelText( 'Category 1' ) );

				expect( setAttributes ).toHaveBeenCalledWith( {
					selectedNewsletterCategoryIds: [ defaultProps.availableNewsletterCategories[ 1 ].id ],
				} );
			} );

			test( 'toggles pre-select control when all categories are unchecked', async () => {
				const user = userEvent.setup();
				render(
					<SubscriptionsInspectorControls
						{ ...defaultProps }
						preselectNewsletterCategories
						selectedNewsletterCategoryIds={ [ defaultProps.availableNewsletterCategories[ 0 ].id ] }
					/>
				);

				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );
				await user.click( screen.getByLabelText( 'Category 1' ) );

				expect( setAttributes ).toHaveBeenCalledWith( {
					selectedNewsletterCategoryIds: [],
					preselectNewsletterCategories: false,
				} );
			} );

			test( 'filters out invalid selected IDs', () => {
				render(
					<SubscriptionsInspectorControls
						{ ...defaultProps }
						selectedNewsletterCategoryIds={ [
							defaultProps.availableNewsletterCategories[ 0 ].id,
							defaultProps.availableNewsletterCategories[ 1 ].id,
							3,
						] }
					/>
				);

				expect( setAttributes ).toHaveBeenCalledWith( {
					selectedNewsletterCategoryIds: [
						defaultProps.availableNewsletterCategories[ 0 ].id,
						defaultProps.availableNewsletterCategories[ 1 ].id,
					],
				} );
			} );

			test( 'disables pre-select option if no valid categories remain selected', () => {
				render(
					<SubscriptionsInspectorControls
						{ ...defaultProps }
						selectedNewsletterCategoryIds={ [ 3 ] }
						preselectNewsletterCategories
					/>
				);

				expect( setAttributes ).toHaveBeenCalledWith( {
					selectedNewsletterCategoryIds: [],
					preselectNewsletterCategories: false,
				} );
			} );
		} );

		describe( 'Subscribe message control', () => {
			test( 'is hidden when isButtonOnlyStyle is false (even with edit cap)', async () => {
				mockCanEditSiteSettings( true );
				mockSubscriptionOptions( { subscribe_modal_heading: 'Hello' } );
				const user = userEvent.setup();
				render(
					<SubscriptionsInspectorControls { ...defaultProps } isButtonOnlyStyle={ false } />
				);
				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				expect( screen.queryByLabelText( 'Subscribe message' ) ).not.toBeInTheDocument();
			} );

			test( 'is hidden when user cannot edit site settings', async () => {
				mockCanEditSiteSettings( false );
				mockSubscriptionOptions( { subscribe_modal_heading: 'Hello' } );
				const user = userEvent.setup();
				render( <SubscriptionsInspectorControls { ...defaultProps } isButtonOnlyStyle={ true } /> );
				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				expect( screen.queryByLabelText( 'Subscribe message' ) ).not.toBeInTheDocument();
			} );

			test( 'is hidden while edit capability is still loading (undefined)', async () => {
				mockCanEditSiteSettings( undefined );
				mockSubscriptionOptions( { subscribe_modal_heading: 'Hello' } );
				const user = userEvent.setup();
				render( <SubscriptionsInspectorControls { ...defaultProps } isButtonOnlyStyle={ true } /> );
				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				expect( screen.queryByLabelText( 'Subscribe message' ) ).not.toBeInTheDocument();
			} );

			test( 'renders and merges typed value into subscription_options on change', async () => {
				mockCanEditSiteSettings( true );
				mockSubscriptionOptions( {
					invitation: 'I',
					welcome: 'W',
					comment_follow: 'CF',
					subscribe_modal_heading: '',
				} );
				const user = userEvent.setup();
				render( <SubscriptionsInspectorControls { ...defaultProps } isButtonOnlyStyle={ true } /> );
				await user.click( screen.getByText( 'Settings' ), { selector: 'button' } );

				const textarea = screen.getByLabelText( 'Subscribe message' );
				expect( textarea ).toBeInTheDocument();

				await user.type( textarea, 'H' );

				expect( setSubscriptionOptions ).toHaveBeenLastCalledWith( {
					invitation: 'I',
					welcome: 'W',
					comment_follow: 'CF',
					subscribe_modal_heading: 'H',
				} );
			} );
		} );
	} );
} );
