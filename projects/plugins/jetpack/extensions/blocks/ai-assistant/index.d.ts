interface Window {
	Jetpack_Editor_Initial_State: {
		siteLocale: string;
		adminUrl: string;
		available_blocks: {
			'jetpack/ai-assistant-support': boolean;
		};
		tracksUserData: {
			userid: number;
			username: string;
		};
		wpcomBlogId: string;
	};
}

interface String {
	replaceAll( pattern: string, replacement: string ): string;
}
