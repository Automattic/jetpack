import type { VerbumComments as VerbumCommentsType } from '../types';

type ScriptLoader = {
	loadScript: ( url: string ) => Promise< void >;
};

declare global {
	const VerbumComments: VerbumCommentsType;
	const verbumBlockEditor: {
		attachGutenberg: (
			textarea: HTMLTextAreaElement,
			content: ( embedUrl: string ) => void,
			isRtl: boolean,
			onEmbedContent: ( embedUrl: string ) => void
		) => void;
	};
	const vbeCacheBuster: string;
	const WP_Enqueue_Dynamic_Script: ScriptLoader;
	const wp: Record< string, unknown >;

	interface Window {
		wpApiSettings: {
			root?: string;
		};
	}

	/**
	 * Contains the current app's bundle size in bytes. Populated in vite.config.ts.
	 * Useful to determine the connection speed.
	 */
	const verbumBundleSize: number;
}
