/**
 * Per-platform switches seeded by `Initial_State::get_data()`. Defaults describe
 * a Jetpack-connected site, so storybook and tests need no global.
 */

interface RawConfig {
	apiSource?: string;
	wpcomUpgradeUrl?: string;
	tracksUserData?: TracksUserData | null;
	knownThreatsAvailable?: boolean;
	hiddenGroups?: string[];
}

export interface TracksUserData {
	userid: number;
	username: string;
}

declare const JPACTIVITYLOG_INITIAL_STATE: { config?: RawConfig } | undefined;

const raw: RawConfig =
	( typeof JPACTIVITYLOG_INITIAL_STATE !== 'undefined'
		? JPACTIVITYLOG_INITIAL_STATE?.config
		: undefined ) ?? {};

export const config = {
	/** `wpcom` calls WordPress.com directly; `jetpack` goes through the site's REST proxy. */
	apiSource: raw.apiSource === 'wpcom' ? ( 'wpcom' as const ) : ( 'jetpack' as const ),
	/** Set when the upgrade is a WordPress.com plan rather than a Jetpack product. */
	wpcomUpgradeUrl: raw.wpcomUpgradeUrl || '',
	/** Set when the Jetpack connection can't identify the user, as on Simple. */
	tracksUserData: raw.tracksUserData ?? null,
	/** Whether backups are checked for known threats; only WoA sites are, for now. */
	knownThreatsAvailable: raw.knownThreatsAvailable === true,
	/** Activity groups sent as `not_group`, e.g. backup events on a Simple site without backups. */
	hiddenGroups: Array.isArray( raw.hiddenGroups ) ? raw.hiddenGroups : [],
};
