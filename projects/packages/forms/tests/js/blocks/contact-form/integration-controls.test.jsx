import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// InspectorControls is a slot fill, and a fill renders its children only while a matching slot
// is mounted -- which, for the block inspector, means only while the settings sidebar is open.
// A mock that passes children straight through erases that, and with it any test's ability to
// tell "renders in the sidebar" apart from "renders at all". Modelling the slot keeps the two
// distinguishable; setup() sets `isSidebarOpen` per test, defaulting to open.
let isSidebarOpen = true;

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) =>
		isSidebarOpen ? <div data-testid="inspector">{ children }</div> : null,
	BlockControls: ( { children } ) => <div data-testid="block-toolbar">{ children }</div>,
} ) );

const mockRecordEvent = jest.fn();

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( { tracks: { recordEvent: mockRecordEvent } } ),
} ) );

const actualData = await import( '@wordpress/data' );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useSelect: mapSelect =>
		mapSelect( () => ( {
			getIntegrations: () => [],
			isIntegrationsLoading: () => false,
		} ) ),
	useDispatch: () => ( { refreshIntegrations: jest.fn() } ),
} ) );

await jest.unstable_mockModule( '../../../../src/hooks/use-config-value.ts', () => ( {
	__esModule: true,
	default: () => true,
} ) );

await jest.unstable_mockModule( '../../../../src/store/integrations/index.ts', () => ( {
	INTEGRATIONS_STORE: 'jetpack/forms/integrations',
} ) );

await jest.unstable_mockModule(
	'../../../../src/blocks/contact-form/components/jetpack-integrations-modal/active-integrations/index.jsx',
	() => ( { __esModule: true, default: () => <div>Active integrations</div> } )
);

await jest.unstable_mockModule(
	'../../../../src/blocks/contact-form/components/jetpack-integrations-modal/components/consent-toggle.tsx',
	() => ( { __esModule: true, default: () => null } )
);

// Stood in for, rather than rendered: the real dialog pulls in the whole integrations UI, and
// what this file is about is whether the dialog gets to render at all from each entry point.
await jest.unstable_mockModule(
	'../../../../src/blocks/contact-form/components/jetpack-integrations-modal/index.tsx',
	() => ( {
		__esModule: true,
		default: ( { isOpen } ) => ( isOpen ? <div role="dialog">Integrations</div> : null ),
	} )
);

const { default: IntegrationControls } = await import(
	'../../../../src/blocks/contact-form/components/jetpack-integration-controls.jsx'
);

// Hoisted: an inline arrow in JSX props trips react/jsx-no-bind.
const noop = () => {};

const setup = ( { sidebarOpen = true } = {} ) => {
	isSidebarOpen = sidebarOpen;
	render( <IntegrationControls attributes={ {} } setAttributes={ noop } /> );
};

const toolbarButton = () =>
	within( screen.getByTestId( 'block-toolbar' ) ).getByRole( 'button', { name: 'Integrations' } );

describe( 'IntegrationControls', () => {
	beforeEach( () => {
		mockRecordEvent.mockClear();
	} );

	// The toolbar button exists so an author can reach integrations from the canvas, which is
	// exactly the situation in which the settings sidebar is likely to be closed -- Gutenberg
	// opens a new post that way. Neither it nor the dialog it opens can therefore live inside
	// InspectorControls: a fill whose slot is unmounted renders nothing, so the button would
	// not exist at all, and a click could not have produced a dialog even if it did.
	it( 'opens the modal from the toolbar while the sidebar is closed', async () => {
		setup( { sidebarOpen: false } );

		// Guards the premise: with the sidebar closed the inspector panel really is absent,
		// so the toolbar button is the only way in.
		expect( screen.queryByTestId( 'inspector' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();

		await userEvent.click( toolbarButton() );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_forms_block_modal_view', {
			entry_point: 'block-toolbar',
		} );
	} );

	it( 'still renders the panel in the inspector while the sidebar is open', async () => {
		setup();

		const inspector = within( screen.getByTestId( 'inspector' ) );
		// PanelBody renders collapsed (initialOpen={false}), so nothing inside it exists in
		// the DOM until the title is activated. The title shares its name with the toolbar
		// button, hence the index rather than getByRole.
		await userEvent.click( inspector.getAllByRole( 'button', { name: 'Integrations' } )[ 0 ] );

		// Exactly one panel: a fill rendered from two places is the classic mistake when
		// splitting a component across the inspector and the toolbar, and this button is
		// unique to the panel half.
		expect( screen.getAllByRole( 'button', { name: 'Manage integrations' } ) ).toHaveLength( 1 );
		await userEvent.click( inspector.getByRole( 'button', { name: 'Manage integrations' } ) );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
		expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_forms_block_modal_view', {
			entry_point: 'block-sidebar',
		} );
	} );

	it( 'keeps the toolbar entry point working while the sidebar is open', async () => {
		setup();

		await userEvent.click( toolbarButton() );

		expect( screen.getByRole( 'dialog' ) ).toBeInTheDocument();
	} );
} );
