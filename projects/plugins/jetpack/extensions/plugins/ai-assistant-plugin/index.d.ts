interface Window {
	Jetpack_Editor_Initial_State: {
		siteLocale: string;
		adminUrl: string;
		available_blocks: {
			[ key: string ]: {
				available: boolean;
			};
		};
		tracksUserData: {
			userid: number;
			username: string;
		};
		wpcomBlogId: string;
	};
}
