import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

// The `p` path must be present so the wp-build dashboard doesn't redirect (and strip
// any appended query args such as `&connect-gdrive=true`) when it loads with no route.
export const PARTIAL_RESPONSES_PATH =
	'admin.php?page=jetpack-forms-responses-wp-admin&p=/responses/inbox';
export const FULL_RESPONSES_PATH = getJetpackData()?.adminUrl + PARTIAL_RESPONSES_PATH;
