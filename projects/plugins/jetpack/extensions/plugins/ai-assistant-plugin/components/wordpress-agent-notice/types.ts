import type { TracksAudienceProperties } from './tracks-audience';
import type {
	PLACEMENT_DOCUMENT_SETTINGS,
	PLACEMENT_JETPACK_SIDEBAR,
	PLACEMENT_PRE_PUBLISH,
} from '../ai-assistant-plugin-sidebar/constants';
import type { SiteType } from '@automattic/jetpack-script-data';

export type WordPressAgentNoticePlacement =
	| typeof PLACEMENT_JETPACK_SIDEBAR
	| typeof PLACEMENT_DOCUMENT_SETTINGS
	| typeof PLACEMENT_PRE_PUBLISH;

export type WordPressAgentNoticeProps = {
	placement: WordPressAgentNoticePlacement;
};

// The preferences store types do not describe its selectors, so name the one we read.
export type PreferencesSelect = {
	get: ( scope: string, name: string ) => unknown;
};

// Likewise for the editor store, which is addressed by name to avoid importing it.
export type EditorSelect = {
	getCurrentPostType?: () => string | undefined;
};

export type WordPressAgentNoticeEventProperties = TracksAudienceProperties & {
	placement: WordPressAgentNoticePlacement;
	// The family's settled editor value, present while the core/editor store is registered.
	surface?: 'block_editor';
	site_type: SiteType;
	post_type?: string;
	current_tier_slug?: string;
};
