import { render, screen } from '@testing-library/react';
import getUnavailableCause from '../unavailable-blocks-notice/get-unavailable-cause';
import UnavailableBlockEdit from '../unavailable-blocks-notice/unavailable-block-edit';
import type {
	UnavailableBlocksData,
	UnavailableCause,
} from '../unavailable-blocks-notice/get-unavailable-cause';

jest.mock( '@wordpress/block-editor', () => {
	const { createReduxStore, register } = jest.requireActual( '@wordpress/data' );
	const store = createReduxStore( 'core/block-editor', {
		reducer: ( state = {} ) => state,
		selectors: { canInsertBlockType: () => false, getBlockRootClientId: () => '' },
		actions: { replaceBlock: () => ( { type: 'REPLACE_BLOCK' } ) },
	} );
	register( store );

	return {
		store,
		useBlockProps: () => ( {} ),
		Warning: ( { children, actions } ) => (
			<div>
				{ children }
				{ actions }
			</div>
		),
	};
} );

const newsletter = { name: 'Newsletter', forced: false };
const forms = { name: 'Forms', forced: false };

const makeData = ( overrides: Partial< UnavailableBlocksData > = {} ): UnavailableBlocksData => ( {
	reason: null,
	canFix: true,
	fixUrl: 'https://example.com/wp-admin/admin.php?page=jetpack#/writing',
	features: {},
	canManageModules: true,
	modulesUrl: 'https://example.com/wp-admin/admin.php?page=jetpack_modules',
	independent: [ 'jetpack/contact-form' ],
	ignored: [ 'jetpack/revue' ],
	...overrides,
} );

it.each( [
	[ 'a block from another plugin', 'acme/thing', { reason: 'blocks_module' }, null ],
	[ 'a block Jetpack no longer ships', 'jetpack/revue', { reason: 'blocks_module' }, null ],
	[ 'no known cause', 'jetpack/map', {}, null ],
	[ 'Blocks off', 'jetpack/map', { reason: 'blocks_module' }, { type: 'blocks_module' } ],
	[
		'Blocks off outranks the feature',
		'jetpack/subscriptions',
		{ reason: 'blocks_module', features: { 'jetpack/subscriptions': newsletter } },
		{ type: 'blocks_module' },
	],
	[
		'feature off',
		'jetpack/subscriptions',
		{ features: { 'jetpack/subscriptions': newsletter } },
		{ type: 'feature', ...newsletter },
	],
	[ 'a form is not blamed on Blocks', 'jetpack/contact-form', { reason: 'blocks_module' }, null ],
	[
		'a form with Blocks and Forms off is blamed on Forms',
		'jetpack/contact-form',
		{ reason: 'blocks_module', features: { 'jetpack/contact-form': forms } },
		{ type: 'feature', ...forms },
	],
	[
		'a form on a disconnected site',
		'jetpack/contact-form',
		{ reason: 'not_connected' },
		{ type: 'not_connected' },
	],
] as const )( 'resolves the cause for %s', ( _label, name, overrides, expected ) => {
	expect(
		getUnavailableCause( name, makeData( overrides as Partial< UnavailableBlocksData > ) )
	).toEqual( expected );
} );

it.each( [
	[ 'Blocks off, admin', { type: 'blocks_module' }, {}, 'Turn on Jetpack Blocks' ],
	[ 'Blocks off, editor', { type: 'blocks_module' }, { canFix: false }, null ],
	[ 'not connected, admin', { type: 'not_connected' }, {}, 'Connect Jetpack' ],
	[ 'disabled, admin', { type: 'disabled' }, {}, null ],
	[ 'feature off, admin', { type: 'feature', ...newsletter }, {}, 'Manage Jetpack features' ],
	[ 'feature off, editor', { type: 'feature', ...newsletter }, { canManageModules: false }, null ],
	[ 'feature forced off, admin', { type: 'feature', name: 'Newsletter', forced: true }, {}, null ],
] as const )(
	'offers a fix only to users who can apply it: %s',
	( _label, cause, overrides, link ) => {
		render(
			<UnavailableBlockEdit
				attributes={ {} }
				clientId="abc"
				cause={ cause as UnavailableCause }
				data={ makeData( overrides ) }
			/>
		);

		expect( screen.getByText( /block is unavailable because/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'link' )?.textContent ?? null ).toBe( link );
	}
);
