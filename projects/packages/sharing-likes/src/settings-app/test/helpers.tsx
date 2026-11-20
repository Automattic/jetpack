import { render } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store } from '../data/store';
import type { PlacementChoice, Services, Settings, SharingLikesScriptData, Status } from '../types';
import type { APIFetchOptions } from '@wordpress/api-fetch';
import type { ReactNode } from 'react';

export const baseStatus: Status = {
	sharing: { state: 'configure', managed_templates: [] },
	likes: { state: 'configure', supported: true, managed_templates: [] },
	comment_likes: { supported: true, follows_likes_settings: false },
	placement: true,
	site_editor_url: 'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template',
	page_template_editor_url: '',
};

export const baseSettings: Settings = {
	likes_enabled: true,
	comment_likes_enabled: false,
	button_style: 'icon-text',
	sharing_label: 'Share this:',
	show: [ 'post', 'page' ],
	twitter_site_tag: '',
};

export const placementChoices: PlacementChoice[] = [
	{ value: 'index', label: 'Front Page, Archive Pages, and Search Results' },
	{ value: 'post', label: 'Posts' },
	{ value: 'page', label: 'Pages' },
];

/**
 * Print the page's script data the way `Settings_App` would.
 *
 * @param overrides - Fields to replace.
 */
export function setScriptData( overrides: Partial< SharingLikesScriptData > = {} ) {
	( window as unknown as { JetpackScriptData: unknown } ).JetpackScriptData = {
		site: { rest_root: 'https://example.com/wp-json/', rest_nonce: 'nonce' },
		sharing_likes: {
			status: baseStatus,
			settings: baseSettings,
			placement_choices: placementChoices,
			multibyte_supported: true,
			private_site: false,
			comments_closed_by_default: false,
			discussion_settings_url: 'https://example.com/wp-admin/options-discussion.php',
			...overrides,
		},
	};
}

type Registry = ReturnType< typeof createRegistry >;

interface StoreContents {
	status?: Status;
	settings?: Settings;
	services?: Services;
}

// The registry the last render used, which is where its snackbars land.
let current: Registry | undefined;

/**
 * A registry with the store seeded like the stage seeds it, and services when given.
 *
 * @param data          - Store contents.
 * @param data.status   - Status.
 * @param data.settings - Settings.
 * @param data.services - Services; read from the route when omitted.
 * @return Registry.
 */
export function createTestRegistry( {
	status = baseStatus,
	settings = baseSettings,
	services,
}: StoreContents = {} ): Registry {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( store );
	registry.dispatch( store ).seed( { status, settings } );
	if ( services ) {
		registry.dispatch( store ).receive( 'services', services );
		registry.dispatch( store ).finishResolution( 'getServices', [] );
	}
	current = registry;
	return registry;
}

/**
 * Wrapper for `renderHook`.
 *
 * @param registry - Registry.
 * @return Wrapper component.
 */
export function wrapperFor( registry: Registry ) {
	return function Wrapper( { children }: { children: ReactNode } ) {
		return <RegistryProvider value={ registry }>{ children }</RegistryProvider>;
	};
}

/**
 * Render inside a seeded registry.
 *
 * @param ui   - Element.
 * @param data - Store contents.
 * @return Render result plus the registry.
 */
export function renderWithData( ui: ReactNode, data: StoreContents = {} ) {
	const registry = createTestRegistry( data );
	return { registry, ...render( ui, { wrapper: wrapperFor( registry ) } ) };
}

/**
 * Every notice the last render's registry holds.
 *
 * @return Notices.
 */
export function notices() {
	return current?.select( noticesStore ).getNotices() ?? [];
}

/**
 * Text of every notice the last render's registry holds.
 *
 * @return Messages.
 */
export function snackbarMessages(): string[] {
	return notices().map( notice => String( notice.content ) );
}

/**
 * The options apiFetch was called with, optionally filtered by method.
 *
 * @param method - HTTP method, or undefined for GETs.
 * @return Call options.
 */
export function apiCalls( method?: string ): APIFetchOptions[] {
	return ( apiFetch as jest.MockedFunction< typeof apiFetch > ).mock.calls
		.map( ( [ options ] ) => options )
		.filter( options => options.method === method );
}
