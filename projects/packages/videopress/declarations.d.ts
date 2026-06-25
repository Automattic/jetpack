declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';
declare module '*.css';
declare module '*.mdx';

/**
 * The pieces of `window.wp` this package consumes. Cast to this rather than
 * augmenting `Window.wp`, which can't merge with other packages' inline shapes.
 */
type WpGlobal = {
	media?: ( opts: unknown ) => WpMediaFrame;
	apiFetch?: ( options: Record< string, unknown > ) => Promise< Response >;
};

/** Attachment shape returned by `wp.media`'s selection model. */
type WpMediaAttachment = { id: number; url: string };

/** Subset of the `wp.media` modal frame interface this package uses. */
type WpMediaFrame = {
	on: ( evt: 'select' | 'close', fn: () => void ) => void;
	state: () => {
		get: ( k: string ) => { first: () => { toJSON: () => WpMediaAttachment } };
	};
	open: () => void;
};
