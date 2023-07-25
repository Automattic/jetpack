/// <reference types="svelte" />
export type Monitor = 'inbound_rest_request' | 'outbound_request';

declare global {
	interface Window {
		[ key: string ]: unknown;
	}
}
