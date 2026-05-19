export declare global {
	interface Window {
		wp: {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			media: any;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			apiFetch?: ( options: Record< string, any > ) => Promise< Response >;
		};
	}

	const JPVIDEOPRESS_INITIAL_STATE:
		| undefined
		| {
				API: {
					WP_API_root: string;
					WP_API_nonce: string;
				};
				jetpackStatus: {
					calypsoSlug: string;
				};
				siteData: {
					id: number | string;
					title: string;
					adminUrl: string;
					slug: string;
					gmtOffset: number;
					timezoneString: string;
					locale: string;
					hasVideoPressAccess: boolean;
				};
				assets: {
					buildUrl: string;
				};
		  };
}
