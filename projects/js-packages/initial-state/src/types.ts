export interface SiteData {
	admin_url: string;
	blog_id: number;
	rest_nonce: string;
	rest_root: string;
	title: string;
}

export interface CurrentUserData {
	id: number;
	display_name: string;
}

export interface UserData {
	current_user: CurrentUserData;
}

export interface JetpackInitialState {
	site: SiteData;
	user: UserData;
}

declare global {
	interface Window {
		JETPACK_INITIAL_STATE: JetpackInitialState;
	}
}
