import { getScriptData } from '@automattic/jetpack-script-data';
import type { PodcatcherId } from './types';

// Server-injected mirror of Settings::SHOW_URL_HOSTS / SHOW_URL_MAX_LENGTH. PHP
// is authoritative; the dashboard reads these instead of hand-copying the values.
const DEFAULT_MAX_LENGTH = 2048;

/**
 * Directory→allowed-host map, lowercase and `www.`-stripped.
 *
 * @return The injected host map, or `{}` when absent.
 */
export const getShowUrlHosts = (): Partial< Record< PodcatcherId, readonly string[] > > =>
	getScriptData()?.podcast?.show_url_hosts ?? {};

/**
 * Hosts allowed for a single directory.
 *
 * @param id - Podcatcher id.
 * @return Allowed hosts, or `[]` when the map is absent.
 */
export const getShowHostsFor = ( id: PodcatcherId ): readonly string[] =>
	getShowUrlHosts()[ id ] ?? [];

/**
 * Known podcatcher ids, derived from the injected host map.
 *
 * @return The list of podcatcher ids.
 */
export const getPodcatcherIds = (): readonly PodcatcherId[] =>
	Object.keys( getShowUrlHosts() ) as PodcatcherId[];

/**
 * Max accepted show-URL length.
 *
 * @return The injected max length, or the default.
 */
export const getShowUrlMaxLength = (): number =>
	getScriptData()?.podcast?.show_url_max_length ?? DEFAULT_MAX_LENGTH;
