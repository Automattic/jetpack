import { getScriptData } from '@automattic/jetpack-script-data';
import type { PodcatcherId } from './types';

const DEFAULT_MAX_LENGTH = 2048;

/**
 * The directory→allowed-hosts map PHP sent us.
 *
 * @return The map, or `{}` if missing.
 */
export const getShowUrlHosts = (): Partial< Record< PodcatcherId, readonly string[] > > =>
	getScriptData()?.podcast?.show_url_hosts ?? {};

/**
 * Hosts allowed for one directory.
 *
 * @param id - Which directory.
 * @return Its hosts, or `[]` if missing.
 */
export const getShowHostsFor = ( id: PodcatcherId ): readonly string[] =>
	getShowUrlHosts()[ id ] ?? [];

/**
 * The directories PHP knows about.
 *
 * @return Their ids.
 */
export const getPodcatcherIds = (): readonly PodcatcherId[] =>
	Object.keys( getShowUrlHosts() ) as PodcatcherId[];

/**
 * Longest show URL we accept.
 *
 * @return The limit.
 */
export const getShowUrlMaxLength = (): number =>
	getScriptData()?.podcast?.show_url_max_length ?? DEFAULT_MAX_LENGTH;
