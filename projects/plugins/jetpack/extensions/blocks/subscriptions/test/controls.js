import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { addFilter, removeFilter } from '@wordpress/hooks';
import { DEFAULT_FONTSIZE_VALUE } from '../constants';
import SubscriptionsInspectorControls from '../controls';

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

beforeEach( () => {
	setAttributes.mockClear();
	setGradient.mockClear();
	setTextColor.mockClear();
	setButtonBackgroundColor.mockClear();
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
	} );
} );
