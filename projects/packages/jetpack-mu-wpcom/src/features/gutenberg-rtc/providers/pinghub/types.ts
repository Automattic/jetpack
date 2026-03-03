import type { ConnectionStatus } from '@wordpress/sync';

export type PingHubEvents = {
	status: ( status: ConnectionStatus ) => void;
};

export interface PingHubBridge {
	connect( path: string ): Promise< void >;
	disconnect( path: string ): Promise< void >;
	send( path: string, data: Uint8Array ): void;
	onMessage( path: string, handler: ( data: Uint8Array ) => void ): void;
	offMessage( path: string, handler: ( data: Uint8Array ) => void ): void;
	onOpen( path: string, handler: () => void ): void;
	offOpen( path: string, handler: () => void ): void;
	onClose( path: string, handler: ( code: number, reason: string ) => void ): void;
	offClose( path: string, handler: ( code: number, reason: string ) => void ): void;
}

/**
 * Body of a PingHub proxy response (open, close, message, or error).
 */
export interface ProxyResponseBody {
	type: 'open' | 'close' | 'message' | 'error';
	code?: number;
	reason?: string;
	text?: string;
	data?: ArrayBuffer | Blob | string;
}

/**
 * Normalized proxy response we can handle in one place.
 */
export interface NormalizedProxyResponse {
	body: ProxyResponseBody;
	code: number;
	callback: string;
}
