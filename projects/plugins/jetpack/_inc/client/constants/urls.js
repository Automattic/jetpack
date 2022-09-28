import { getRedirectUrl } from '@automattic/jetpack-components';

export const imagePath = window.Initial_State.pluginBaseUrl + '/images/';
export const JETPACK_CONTACT_SUPPORT = getRedirectUrl( 'jetpack-contact-support' );
export const JETPACK_CONTACT_BETA_SUPPORT = getRedirectUrl( 'jetpack-contact-support-beta-group' );

export const GETTING_STARTED_WITH_JETPACK_BACKUP_VIDEO_URL =
	'https://jetpack.com/support/backup/the-jetpack-backup-plugin/getting-started-with-the-jetpack-backup-plugin/#starting-your-first-backup';
