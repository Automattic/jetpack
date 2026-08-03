interface Window {
	Jetpack_Editor_Initial_State: {
		siteFragment: string;
		siteLocale: string;
		adminUrl: string;
		available_blocks: {
			'jetpack/ai-assistant-support': boolean;
		};
		jetpack?: {
			can_send_test_email_to_others?:boolean;
		};
		tracksUserData: {
			userid: number;
			username: string;
			email: string;
		};
		wpcomBlogId: string;
	};
}

interface String {
	replaceAll( pattern: string, replacement: string ): string;
}
