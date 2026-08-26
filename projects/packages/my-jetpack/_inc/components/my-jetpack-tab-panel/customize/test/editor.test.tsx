import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiFetch from '@wordpress/api-fetch';
import { getMyJetpackWindowInitialState } from '../../../../data/utils/get-my-jetpack-window-state';
import { CustomizeContent } from '../content';
import type { AdminMenuItem, AdminMenuModel } from '../types';

jest.mock( '@wordpress/api-fetch' );
jest.mock( '../../../../data/utils/get-my-jetpack-window-state' );

const mockPreview = {
	apply: jest.fn(),
	commit: jest.fn(),
	restore: jest.fn(),
};

jest.mock( '../live-preview', () => ( {
	createJetpackMenuPreview: () => mockPreview,
} ) );

jest.mock( '@wordpress/ui', () => {
	const react = jest.requireActual( 'react' );
	const element = react.createElement;
	const container =
		( tag = 'div' ) =>
		( { children, ...props } ) =>
			element( tag, props, children );

	return {
		Button: ( { children, loading, loadingAnnouncement, ...props } ) => {
			void loading;
			void loadingAnnouncement;
			return element( 'button', props, children );
		},
		Card: {
			Root: container(),
			Content: container(),
		},
		Checkbox: ( { checked, onCheckedChange, ...props } ) =>
			element( 'input', {
				...props,
				type: 'checkbox',
				checked,
				onChange: event => onCheckedChange?.( event.target.checked ),
			} ),
		IconButton: ( { label, icon, loading, loadingAnnouncement, ...props } ) => {
			void icon;
			void loading;
			void loadingAnnouncement;
			return element( 'button', { ...props, 'aria-label': label } );
		},
		InputControl: ( { label, onValueChange, description, hideLabelFromVision, ...props } ) => {
			void description;
			void hideLabelFromVision;
			return element(
				'label',
				null,
				label,
				element( 'input', {
					...props,
					'aria-label': label,
					onChange: event => onValueChange?.( event.target.value ),
				} )
			);
		},
		Notice: {
			Root: ( { children, intent, ...props } ) =>
				element(
					'div',
					{ ...props, role: intent === 'error' ? 'alert' : 'status', 'data-intent': intent },
					children
				),
			Description: container( 'span' ),
			CloseIcon: ( { label, ...props } ) => element( 'button', { ...props, 'aria-label': label } ),
		},
		Stack: container(),
		Text: container( 'span' ),
	};
} );

const mockApiFetch = apiFetch as unknown as jest.MockedFunction< typeof apiFetch >;
const mockGetWindowState = getMyJetpackWindowInitialState as jest.Mock;

const makeItem = (
	id: string,
	label: string,
	overrides: Partial< AdminMenuItem > = {}
): AdminMenuItem => ( {
	id,
	label,
	menuSlug: id,
	order: 0,
	hasSavedOrder: false,
	customizable: true,
	hidden: false,
	external: false,
	...overrides,
} );

const buildModel = ( overrides: Partial< AdminMenuModel > = {} ): AdminMenuModel => ( {
	featureEnabled: true,
	active: false,
	hasPersonalLayout: false,
	siteLayout: { enabled: false, items: {}, separators: {} },
	userLayout: { items: {}, separators: {} },
	separators: {},
	items: [
		makeItem( 'my-jetpack', 'My Jetpack', { customizable: false } ),
		makeItem( 'forms', 'Forms' ),
		makeItem( 'scan', 'Scan' ),
		makeItem( 'settings', 'Settings', { customizable: false } ),
		makeItem( 'jetpack-manage', 'Jetpack Manage', {
			customizable: false,
			external: true,
		} ),
	],
	...overrides,
} );

const arrangeInitialState = ( model: AdminMenuModel, userIsAdmin = true ) => {
	mockGetWindowState.mockImplementation( key => {
		if ( key === 'adminMenuCustomization' ) {
			return model;
		}
		if ( key === 'userIsAdmin' ) {
			return userIsAdmin;
		}
		return undefined;
	} );
	mockApiFetch.mockImplementation( options => {
		if ( options.method === 'POST' ) {
			return Promise.resolve( model ) as ReturnType< typeof apiFetch >;
		}
		return Promise.resolve( model ) as ReturnType< typeof apiFetch >;
	} );
};

describe( 'CustomizeContent', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		arrangeInitialState( buildModel() );
	} );

	it( 'presents one direct menu editor without legacy group and default controls', async () => {
		render( <CustomizeContent /> );
		await expect( screen.findByText( 'Menu is up to date' ) ).resolves.toBeInTheDocument();

		expect(
			screen.getByRole( 'heading', { name: 'Customize my Jetpack menu' } )
		).toBeInTheDocument();
		expect(
			screen.getByText( 'Drag items and separators. Changes preview live.' )
		).toBeInTheDocument();
		expect( screen.getAllByText( 'Base separator', { exact: true } ) ).toHaveLength( 2 );
		expect( screen.queryByText( 'Recommended menu' ) ).not.toBeInTheDocument();
		expect( screen.queryByText( 'Group' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Save defaults' } ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Use legacy menu' } ) ).not.toBeInTheDocument();

		await waitFor( () => expect( mockPreview.apply ).toHaveBeenCalled() );
	} );

	it( 'adds and titles a separator, then previews every draft edit', async () => {
		const user = userEvent.setup();
		render( <CustomizeContent /> );
		await user.click( screen.getByRole( 'button', { name: 'Add separator' } ) );

		const title = screen.getByRole( 'textbox', { name: 'Separator title (optional)' } );
		await user.type( title, 'Security' );

		expect( title ).toHaveValue( 'Security' );
		expect( screen.getByText( 'Unsaved changes' ) ).toBeInTheDocument();
		expect( mockPreview.apply ).toHaveBeenCalled();
	} );

	it( 'can save the generated menu to create a personal layout without another edit', async () => {
		const user = userEvent.setup();
		render( <CustomizeContent /> );
		await expect( screen.findByText( 'Menu is up to date' ) ).resolves.toBeInTheDocument();
		const saveButton = screen.getByRole( 'button', { name: 'Save my menu' } );

		expect( saveButton ).toBeEnabled();
		await user.click( saveButton );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					method: 'POST',
					data: expect.objectContaining( { scope: 'user' } ),
				} )
			)
		);
	} );

	it( 'saves a complete personal snapshot through the primary action', async () => {
		const user = userEvent.setup();
		render( <CustomizeContent /> );
		await user.click( screen.getByRole( 'checkbox', { name: 'Show Forms in menu' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Add separator' } ) );
		await user.type(
			screen.getByRole( 'textbox', { name: 'Separator title (optional)' } ),
			'Security'
		);
		await user.click( screen.getByRole( 'button', { name: 'Save my menu' } ) );

		await waitFor( () => {
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					method: 'POST',
					data: expect.objectContaining( { scope: 'user' } ),
				} )
			);
		} );
		const saveCall = mockApiFetch.mock.calls.find( call => call[ 0 ].method === 'POST' );
		const data = saveCall?.[ 0 ].data as {
			scope: string;
			layout: {
				items: Record< string, { hidden: boolean } >;
				separators: Record< string, { title: string } >;
			};
		};
		expect( data.layout.items.forms.hidden ).toBe( true );
		expect( Object.values( data.layout.separators )[ 0 ].title ).toBe( 'Security' );
		await expect( screen.findByText( 'My menu was saved.' ) ).resolves.toBeInTheDocument();
	} );

	it( 'offers administrators a secondary site-default action with explicit scope', async () => {
		const user = userEvent.setup();
		render( <CustomizeContent /> );
		await user.click( screen.getByRole( 'button', { name: 'Set as site default' } ) );

		await waitFor( () =>
			expect( mockApiFetch ).toHaveBeenCalledWith(
				expect.objectContaining( {
					method: 'POST',
					data: expect.objectContaining( {
						scope: 'site',
						layout: expect.objectContaining( { enabled: true } ),
					} ),
				} )
			)
		);
		await expect( screen.findByText( 'Site default was updated.' ) ).resolves.toBeInTheDocument();
	} );

	it( 'hides site-default publishing from non-administrators', async () => {
		arrangeInitialState( buildModel(), false );
		render( <CustomizeContent /> );
		await expect( screen.findByText( 'Menu is up to date' ) ).resolves.toBeInTheDocument();

		expect(
			screen.queryByRole( 'button', { name: 'Set as site default' } )
		).not.toBeInTheDocument();
	} );

	it( 'keeps the draft and shows a current error notice when saving fails', async () => {
		mockApiFetch.mockImplementation( options => {
			if ( options.method === 'POST' ) {
				return Promise.reject( new Error( 'Nope' ) ) as ReturnType< typeof apiFetch >;
			}
			return Promise.resolve( buildModel() ) as ReturnType< typeof apiFetch >;
		} );
		const user = userEvent.setup();
		render( <CustomizeContent /> );
		await user.click( screen.getByRole( 'button', { name: 'Add separator' } ) );
		await user.click( screen.getByRole( 'button', { name: 'Save my menu' } ) );

		await expect( screen.findByRole( 'alert' ) ).resolves.toHaveTextContent(
			'Your menu could not be saved. Your changes are still here.'
		);
		expect(
			screen.getByRole( 'textbox', { name: 'Separator title (optional)' } )
		).toBeInTheDocument();
	} );

	it( 'restores the sidebar preview when the editor unmounts', () => {
		const { unmount } = render( <CustomizeContent /> );

		unmount();

		expect( mockPreview.restore ).toHaveBeenCalled();
	} );

	it( 'updates item visibility through the accessible checkbox control', async () => {
		const user = userEvent.setup();
		render( <CustomizeContent /> );
		await expect( screen.findByText( 'Menu is up to date' ) ).resolves.toBeInTheDocument();
		const checkbox = screen.getByRole( 'checkbox', { name: 'Show Forms in menu' } );

		await user.click( checkbox );

		expect( checkbox ).not.toBeChecked();
	} );
} );
