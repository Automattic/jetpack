import { getScriptData } from '@automattic/jetpack-script-data';
import type { PlacementChoice, SharingLikesScriptData } from './types';

/**
 * What `Settings_App::add_script_data()` printed for this page.
 *
 * @return The screen's script data, if the page printed any.
 */
export function getSharingLikesScriptData(): SharingLikesScriptData | undefined {
	return ( getScriptData() as unknown as { sharing_likes?: SharingLikesScriptData } | undefined )
		?.sharing_likes;
}

/**
 * Every place the buttons can appear, with its label.
 *
 * @return Placement choices.
 */
export function getPlacementChoices(): PlacementChoice[] {
	return getSharingLikesScriptData()?.placement_choices ?? [];
}

/**
 * Whether the site is private, which restricts the services some hosts offer.
 *
 * @return Whether it is private.
 */
export function isPrivateSite(): boolean {
	return getSharingLikesScriptData()?.private_site ?? false;
}
