import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import apiFetch from '@wordpress/api-fetch';
import { dispatch, select } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { queryKeys } from '../data/queries';
import type { PlacementChoice, Settings, SharingLikesScriptData, Status } from '../types';
import type { APIFetchOptions } from '@wordpress/api-fetch';
import type { ReactNode } from 'react';

export const baseStatus: Status = {
	sharing: { state: 'configure' },
	likes: { state: 'configure', supported: true },
	comment_likes: { supported: true, follows_likes_settings: false },
	placement: true,
	site_editor_url: 'https://example.com/wp-admin/site-editor.php?p=%2Fwp_template',
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
			...overrides,
		},
	};
}

/**
 * A query client seeded like the stage seeds it.
 *
 * @param data          - Cache contents.
 * @param data.status   - Status.
 * @param data.settings - Settings.
 * @return Query client.
 */
export function createTestQueryClient( {
	status = baseStatus,
	settings = baseSettings,
}: { status?: Status; settings?: Settings } = {} ) {
	const queryClient = new QueryClient( {
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	} );
	queryClient.setQueryData( queryKeys.status, status );
	queryClient.setQueryData( queryKeys.settings, settings );
	return queryClient;
}

/**
 * Wrapper for `renderHook`.
 *
 * @param queryClient - Query client.
 * @return Wrapper component.
 */
export function wrapperFor( queryClient: QueryClient ) {
	return function Wrapper( { children }: { children: ReactNode } ) {
		return <QueryClientProvider client={ queryClient }>{ children }</QueryClientProvider>;
	};
}

/**
 * Render inside a seeded query client.
 *
 * @param ui            - Element.
 * @param data          - Cache contents.
 * @param data.status   - Status.
 * @param data.settings - Settings.
 * @return Render result plus the query client.
 */
export function renderWithData(
	ui: ReactNode,
	data: { status?: Status; settings?: Settings } = {}
) {
	const queryClient = createTestQueryClient( data );
	return { queryClient, ...render( ui, { wrapper: wrapperFor( queryClient ) } ) };
}

/**
 * Text of every notice in the store.
 *
 * @return Messages.
 */
export function snackbarMessages(): string[] {
	return select( noticesStore )
		.getNotices()
		.map( notice => String( notice.content ) );
}

/**
 * Clear the notices store between tests.
 */
export function resetNotices() {
	const { removeNotice } = dispatch( noticesStore );
	select( noticesStore )
		.getNotices()
		.forEach( notice => removeNotice( notice.id ) );
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
