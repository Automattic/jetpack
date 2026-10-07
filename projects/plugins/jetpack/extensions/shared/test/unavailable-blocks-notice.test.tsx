import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import getUnavailableCause from '../unavailable-blocks-notice/get-unavailable-cause';
import UnavailableBlockEdit from '../unavailable-blocks-notice/unavailable-block-edit';
import type {
	UnavailableBlocksData,
	UnavailableCause,
} from '../unavailable-blocks-notice/get-unavailable-cause';

const mockReplaceBlock = jest.fn();

jest.mock( '@wordpress/block-editor', () => {
	const { createReduxStore, register } = jest.requireActual( '@wordpress/data' );
	const store = createReduxStore( 'core/block-editor', {
		reducer: ( state = {} ) => state,
		selectors: { canInsertBlockType: () => true, getBlockRootClientId: () => '' },
		actions: {
			replaceBlock: ( clientId, block ) => {
				mockReplaceBlock( clientId, block );
				return { type: 'REPLACE_BLOCK' };
			},
		},
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
	shipped: [ 'jetpack/map', 'jetpack/subscriptions', 'jetpack/contact-form' ],
	...overrides,
} );

it.each( [
	[ 'a block from another plugin', 'acme/thing', { reason: 'blocks_module' }, null ],
	[
		'a jetpack/ block this site does not ship',
		'jetpack/layout-grid',
		{ reason: 'blocks_module' },
		null,
	],
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
	[
		'Blocks off, admin',
		{ type: 'blocks_module' },
		{},
		/Jetpack Blocks is turned off\.$/,
		'writing',
	],
	[
		'Blocks off, editor',
		{ type: 'blocks_module' },
		{ canFix: false },
		/Jetpack Blocks is turned off\. Ask a site administrator/,
		null,
	],
	[
		'not connected, admin',
		{ type: 'not_connected' },
		{},
		/Jetpack is not connected\.$/,
		'writing',
	],
	[
		'not connected, editor',
		{ type: 'not_connected' },
		{ canFix: false },
		/not connected\. Ask a site administrator/,
		null,
	],
	[ 'disabled, admin', { type: 'disabled' }, {}, /Jetpack blocks are disabled on this site/, null ],
	[
		'feature off, admin',
		{ type: 'feature', ...newsletter },
		{},
		/the Newsletter feature is turned off\.$/,
		'jetpack_modules',
	],
	[
		'feature off, editor',
		{ type: 'feature', ...newsletter },
		{ canManageModules: false },
		/Newsletter feature is turned off\. Ask a site administrator/,
		null,
	],
	[
		'feature forced off, admin',
		{ type: 'feature', name: 'Newsletter', forced: true },
		{},
		/the Newsletter feature is disabled on this site/,
		null,
	],
] as const )(
	'explains the cause and offers a fix only to users who can apply it: %s',
	( _label, cause, overrides, message, linkTarget ) => {
		render(
			<UnavailableBlockEdit
				attributes={ {} }
				clientId="abc"
				cause={ cause as UnavailableCause }
				data={ makeData( overrides ) }
			/>
		);

		expect( screen.getByText( message ) ).toBeInTheDocument();
		const link = screen.queryByRole( 'link' );
		if ( linkTarget ) {
			// eslint-disable-next-line jest/no-conditional-expect -- The alternative is a duplicated table.
			expect( link ).toHaveAttribute( 'href', expect.stringContaining( linkTarget ) );
		} else {
			// eslint-disable-next-line jest/no-conditional-expect -- The alternative is a duplicated table.
			expect( link ).not.toBeInTheDocument();
		}
	}
);

describe( 'Keep as HTML', () => {
	const markup = '<div class="wp-block-jetpack-markdown">hi</div>';

	afterEach( () => {
		unregisterBlockType( 'core/html' );
		mockReplaceBlock.mockClear();
	} );

	it.each( [
		[ 'WordPress 7.1 inner content', { role: 'local' }, 'innerContent', [ markup ] ],
		[ 'WordPress 7.0 attribute', { source: 'raw' }, 'attributes', { content: markup } ],
	] as const )( 'keeps the markup with %s', async ( _label, contentAttribute, key, expected ) => {
		registerBlockType( 'core/html', {
			apiVersion: 3,
			title: 'Custom HTML',
			category: 'widgets',
			attributes: { content: { type: 'string', ...contentAttribute } },
			save: () => null,
		} );
		render(
			<UnavailableBlockEdit
				attributes={ { originalUndelimitedContent: markup } }
				clientId="abc"
				cause={ { type: 'blocks_module' } }
				data={ makeData() }
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Keep as HTML' } ) );

		expect( mockReplaceBlock ).toHaveBeenCalledWith(
			'abc',
			expect.objectContaining( { name: 'core/html', [ key ]: expected } )
		);
	} );
} );
