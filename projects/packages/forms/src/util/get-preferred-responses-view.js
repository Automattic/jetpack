import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';

export const PARTIAL_RESPONSES_PATH = 'admin.php?page=jetpack-forms-admin';
export const FULL_RESPONSES_PATH = getJetpackData()?.adminUrl + PARTIAL_RESPONSES_PATH;
