export type SectionState =
	'configure' | 'configure_with_block_nudge' | 'block_call_to_action' | 'off';

export type Feature = 'sharing' | 'likes';

export interface Status {
	sharing: { state: SectionState };
	likes: { state: SectionState; supported: boolean };
	comment_likes: { supported: boolean; follows_likes_settings: boolean };
	placement: boolean;
	site_editor_url: string;
}

export type ButtonStyle = 'icon-text' | 'icon' | 'text' | 'official';

/** Only the keys the screen shows on this site are present. */
export interface Settings {
	likes_enabled?: boolean;
	reblogs_enabled?: boolean;
	comment_likes_enabled?: boolean;
	button_style?: ButtonStyle;
	sharing_label?: string;
	show?: string[];
	twitter_site_tag?: string;
	disable_resources?: boolean;
}

export type SettingKey = keyof Settings;

export interface PlacementChoice {
	value: string;
	label: string;
}

export interface SharingLikesScriptData {
	status: Status;
	settings: Settings;
	placement_choices: PlacementChoice[];
	multibyte_supported: boolean;
}

export interface Service {
	id: string;
	name: string;
	custom: boolean;
	deprecated: boolean;
	url?: string;
	icon?: string;
}

export interface Services {
	visible: string[];
	hidden: string[];
	services: Service[];
}

/**
 * Whether a section variant shows the feature's own options.
 *
 * @param state - Section variant.
 * @return Whether it configures.
 */
export function configures( state: SectionState ): boolean {
	return state === 'configure' || state === 'configure_with_block_nudge';
}
