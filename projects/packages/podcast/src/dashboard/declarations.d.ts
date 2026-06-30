declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		podcast?: {
			has_product_access?: boolean;
			is_connected?: boolean;
			show_url_hosts?: Record< string, readonly string[] >;
			show_url_max_length?: number;
			preload?: Record< string, { body: unknown; headers?: Record< string, string > } >;
			upgrade?: {
				product_slug?: string;
				plan_name?: string;
			};
		};
	}
}
