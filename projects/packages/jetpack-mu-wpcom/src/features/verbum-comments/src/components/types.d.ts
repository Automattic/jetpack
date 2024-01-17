import { VerbumComments } from '../types';

type ScriptLoader = {
	loadScript: ( url: string ) => Promise< void >;
};

declare global {
	const VerbumComments: VerbumComments;
	const vbeCacheBuster: string;
	const WP_Enqueue_Dynamic_Script: ScriptLoader;
	const wp: {};

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
