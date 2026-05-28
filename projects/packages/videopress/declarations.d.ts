declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';
declare module '*.css';
declare module '*.mdx';

/**
 * The pieces of the global `window.wp` namespace this package consumes.
 * Cast to this rather than augmenting `Window.wp` directly — other workspace
 * packages (e.g. `@automattic/number-formatters`) declare their own minimal
 * shape of `Window.wp`, and TypeScript can't merge two anonymous inline
 * object types on the same global property.
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
