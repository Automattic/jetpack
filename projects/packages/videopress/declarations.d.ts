declare module '*.png';
declare module '*.svg';
declare module '*.jpeg';
declare module '*.jpg';
declare module '*.scss';
declare module '*.css';
declare module '*.mdx';

/**
 * The classic-editor `window.wp` namespace pieces the package consumes.
 * Cast to this rather than augmenting `Window.wp` directly — other workspace
 * packages (e.g. `@automattic/number-formatters`) declare their own minimal
 * shape of `Window.wp`, and TypeScript can't merge two anonymous inline
 * object types on the same global property.
 */
type ClassicEditorWp = {
	media?: ( opts: unknown ) => unknown;
	apiFetch?: ( options: Record< string, unknown > ) => Promise< Response >;
};
