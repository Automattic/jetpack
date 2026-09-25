import { describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

/**
 * The panel is loaded through a lazy boundary, so that a site without the plan never
 * fetches, parses or runs any of it.
 *
 * That boundary is invisible to every other test here: panel.test.jsx imports the panel
 * directly, and register.test.js only inspects the guard. Nothing rendered the wrapped
 * BlockEdit, so a broken `lazy()`/`Suspense` pair would have shown up as an empty inspector in
 * the browser and a green suite -- which is how two earlier defects on this feature survived.
 */

const mockHasFeatureFlag = jest.fn( () => true );

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils', () => ( {
	hasFeatureFlag: mockHasFeatureFlag,
	useUpgradeFlow: () => [ 'https://example.com/checkout', () => {}, false ],
} ) );

await jest.unstable_mockModule( '@automattic/jetpack-shared-extension-utils/components', () => ( {
	Nudge: ( { title, description } ) => (
		<p>
			{ title } { description }
		</p>
	),
} ) );

await jest.unstable_mockModule( '../../../../../src/blocks/contact-form/child-blocks.js', () => ( {
	childBlocks: [ { name: 'field-text', conditional_logic: { type: 'string' } } ],
} ) );

const mockToggleBlockHighlight = jest.fn();

await jest.unstable_mockModule( '@wordpress/block-editor', () => ( {
	InspectorControls: ( { children } ) => <div>{ children }</div>,
	BlockControls: ( { children } ) => <div>{ children }</div>,
	store: 'core/block-editor',
} ) );

// Only useDispatch is replaced. Something in the panel's import graph pulls the real store
// helpers from this module, so a mock that omits them fails at import rather than in a test --
// and one that imports the module from inside its own factory recurses until V8 gives up.
// Loading it first, then registering the mock, avoids both.
const actualData = await import( '@wordpress/data' );

await jest.unstable_mockModule( '@wordpress/data', () => ( {
	...actualData,
	useDispatch: () => ( { toggleBlockHighlight: mockToggleBlockHighlight } ),
} ) );

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/conditional-logic/hooks/use-subject-fields.js',
	() => ( {
		__esModule: true,
		default: () => [],
		useEnsureFieldId: () => () => 'field_1',
	} )
);

await jest.unstable_mockModule(
	'../../../../../src/blocks/shared/hooks/use-form-field-ids.js',
	() => ( {
		__esModule: true,
		getFormFieldEntries: () => [],
		default: () => [],
	} )
);

const { withConditionalLogic } =
	await import( '../../../../../src/blocks/shared/conditional-logic/register.jsx' );

// Transform the panel and its dependency tree up front. Without this the first render pays
// for compiling the whole subtree, which overruns findBy's default timeout once the full
// suite saturates the workers -- a failure about machine load, not about the code.
await import( '../../../../../src/blocks/shared/conditional-logic/components/panel.jsx' );

const noop = () => {};
const BlockEdit = ( { name } ) => <div>edit: { name }</div>;
const WrappedBlockEdit = withConditionalLogic( BlockEdit );

const renderBlock = ( name, isSelected = true, attributes = {} ) =>
	render(
		<WrappedBlockEdit
			name={ name }
			isSelected={ isSelected }
			clientId="abc"
			attributes={ attributes }
			setAttributes={ noop }
		/>
	);

describe( 'withConditionalLogic', () => {
	it( 'resolves the lazily loaded panel and mounts it on a field block', async () => {
		renderBlock( 'jetpack/field-text' );

		// The wrapped editor is available immediately; the panel arrives only once the lazy
		// boundary resolves, so this has to be awaited rather than queried synchronously.
		expect( screen.getByText( 'edit: jetpack/field-text' ) ).toBeInTheDocument();
		await expect(
			screen.findByRole( 'button', { name: 'Conditional logic' } )
		).resolves.toBeInTheDocument();
	} );

	/**
	 * The filter wraps every field block, but the inspector only shows the selected one.
	 * Mounting the panel on the rest made its form-tree walk run per field on every
	 * block-editor store change.
	 */
	it( 'does not mount the panel on a field block that is not selected', () => {
		renderBlock( 'jetpack/field-text', false );

		expect( screen.getByText( 'edit: jetpack/field-text' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Conditional logic' } ) ).not.toBeInTheDocument();
	} );

	it( 'offers an upgrade instead of the builder when the plan lacks the feature', async () => {
		mockHasFeatureFlag.mockReturnValueOnce( false );
		const user = userEvent.setup();
		renderBlock( 'jetpack/field-text' );

		await user.click( await screen.findByRole( 'button', { name: 'Add conditional logic' } ) );

		expect( screen.getByText( /Upgrade to use conditional logic\./ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'button', { name: 'Add conditions' } ) ).not.toBeInTheDocument();
	} );

	it( "tells the author when the plan no longer applies a field's saved conditions", async () => {
		mockHasFeatureFlag.mockReturnValueOnce( false );
		renderBlock( 'jetpack/field-text', true, {
			conditionalLogic: {
				enabled: true,
				action: 'show',
				groups: [ { rules: [ { field: 'field_1', operator: 'is', value: 'yes' } ] } ],
			},
		} );

		await expect(
			screen.findByText( /conditions are not applied on your current plan/ )
		).resolves.toBeInTheDocument();
	} );

	it( 'renders a non-field block untouched, without loading the panel', () => {
		renderBlock( 'core/paragraph' );

		expect( screen.getByText( 'edit: core/paragraph' ) ).toBeInTheDocument();
		// Nothing to await: the lazy import is never reached for a block that has no
		// conditional-logic support.
		expect( screen.queryByRole( 'button', { name: 'Conditional logic' } ) ).not.toBeInTheDocument();
	} );
} );
