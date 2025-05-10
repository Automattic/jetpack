import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

export const PREFERRED_VIEW = window?.jpFormsBlocks?.defaults?.preferredView;
export const PARTIAL_RESPONSES_PATH =
	PREFERRED_VIEW === 'classic' ? 'edit.php?post_type=feedback' : 'admin.php?page=jetpack-forms';
export const FULL_RESPONSES_PATH = getJetpackData()?.adminUrl + PARTIAL_RESPONSES_PATH;
