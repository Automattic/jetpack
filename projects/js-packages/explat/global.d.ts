export declare global {
	interface Window {
		jetpackTracks: {
			isEnabled: boolean;
		};
	}

	namespace NodeJS {
		interface ProcessEnv {
			NODE_ENV: 'development' | 'production' | 'test';
		}
	}
}

export {};
