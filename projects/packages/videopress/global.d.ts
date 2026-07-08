export declare global {
	const JPVIDEOPRESS_INITIAL_STATE:
		| undefined
		| {
				API: {
					WP_API_root: string;
					WP_API_nonce: string;
					contentNonce: string;
				};
				jetpackStatus: {
					calypsoSlug: string;
				};
				product: {
					slug: string;
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
					isVideoPress1TB?: boolean;
					isVideoPressUnlimited?: boolean;
				};
				assets: {
					buildUrl: string;
				};
				// Authoritative accepted-upload map (extension => mimetype) from the
				// server's `Admin_UI::get_allowed_video_extensions()`.
				allowedVideoExtensions: Record< string, string >;
				pricing: null | {
					title: string;
					features: string[];
					yearly: {
						slug: string;
						name: string;
						price: number;
						priceByMonth: number;
						currency: string;
						discount?: number;
						salePrice?: number;
						salePriceByMonth?: number;
					};
				};
		  };
}
