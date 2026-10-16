declare module '*.png';
declare module '*.gif';

/**
 * Printed by Jetpack_AI_Page::page_admin_scripts() before the route bundle loads.
 */
interface JetpackAiSettings {
	apiRoot?: string;
	apiNonce?: string;
	pluginUrl?: string;
	assetsVersion?: string;
	tracksUserData?: { userid: number; username: string } | null;
}

interface Window {
	jetpackAiSettings?: JetpackAiSettings;
}
