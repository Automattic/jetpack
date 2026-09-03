declare module '@automattic/jetpack-script-data' {
	interface JetpackScriptData {
		podcast?: {
			has_product_access?: boolean;
			credit_forced?: boolean;
			is_connected?: boolean;
			show_url_hosts?: Record< string, readonly string[] >;
			show_url_max_length?: number;
			feed_limit_max?: number;
			preload?: Record< string, { body: unknown; headers?: Record< string, string > } >;
			selected_category?: { id: number; name: string } | null;
			tracks_user_data?: { userid: number | string; username: string } | null;
			upgrade?: {
				product_slug?: string;
				plan_name?: string;
			};
		};
	}
}
