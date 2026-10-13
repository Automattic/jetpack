import { getScriptData } from '@automattic/jetpack-script-data';
import type { CommentsScriptData } from './types';

/**
 * What `Settings_Page::add_script_data()` printed for this page.
 *
 * @return The screen's script data, if the page printed any.
 */
export function getCommentsScriptData(): CommentsScriptData | undefined {
	return ( getScriptData() as unknown as { jetpack_comments?: CommentsScriptData } | undefined )
		?.jetpack_comments;
}
