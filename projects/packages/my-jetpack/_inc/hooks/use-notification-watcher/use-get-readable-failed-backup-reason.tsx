import { __, sprintf } from '@wordpress/i18n';
import { useMemo, type ReactElement } from 'react';
import useRedBubbleQuery from '../../data/use-red-bubble-query';

export type ReasonContent = {
	reasonContent: {
		title: ReactElement | string | null;
		text: ReactElement | string | null;
	};
	isLoading: boolean;
};

const useGetReadableFailedBackupReason = (): ReasonContent => {
	const { data: redBubbleAlerts, isLoading: isRedBubbleAlertsLoading } = useRedBubbleQuery();

	const { backup_failure: backupFailure } = redBubbleAlerts as RedBubbleAlerts;
	const status = backupFailure?.data?.status;

	const reasonContent = useMemo( () => {
		switch ( status ) {
			// Rewind errors:
			case 'missing_plan':
				return {
					title: __( 'Missing Backup plan', 'jetpack-my-jetpack' ),
					text: __(
						'The site does not appear to have a valid Backup plan. Please purchase a Backup plan in order activate the features of Jetpack Backup.',
						'jetpack-my-jetpack'
					),
				};
			case 'no_connected_jetpack':
				return {
					title: __( 'Not connected', 'jetpack-my-jetpack' ),
					text: __(
						'The site doesn’t appear to be connected. Backup requires an active Jetpack connection in order to function properly.',
						'jetpack-my-jetpack'
					),
				};
			case 'no_connected_jetpack_with_credentials':
				return {
					title: __( 'Not connected', 'jetpack-my-jetpack' ),
					text: __(
						'The site doesn’t appear to be connected. Backup requires an active Jetpack connection in order to function properly, although successful Backups may still appear in the logs.',
						'jetpack-my-jetpack'
					),
				};
			case 'vp_active_on_site':
				return {
					title: __( 'Backup plugin conflict', 'jetpack-my-jetpack' ),
					text: __(
						'We’ve detected VaultPress is currently active on the site. VaultPress and Jetpack Backup cannot run simultaneously. In order to activate Jetpack Backup, you will first need to deactivate VaultPress.',
						'jetpack-my-jetpack'
					),
				};
			case 'vp_can_transfer':
				return {
					title: __( 'Transfer VaultPress', 'jetpack-my-jetpack' ),
					text: __(
						'We’ve detected VaultPress is currently active on the site, and we can automatically transfer it over to Jetpack Backup (Rewind), but you will need to trigger the transfer manually.',
						'jetpack-my-jetpack'
					),
				};
			case 'host_not_supported':
				return {
					title: __( 'Host not supported', 'jetpack-my-jetpack' ),
					text: __(
						'Backup doesn’t currently support the host that the site is hosted on.',
						'jetpack-my-jetpack'
					),
				};
			case 'multisite_not_supported':
				return {
					title: __( 'Multi-site not supported', 'jetpack-my-jetpack' ),
					text: __(
						'Backup can’t be activated on multi-site installations, neither the network site or its sub-sites.',
						'jetpack-my-jetpack'
					),
				};
			case 'no_site_found':
				return {
					title: __( 'No site record', 'jetpack-my-jetpack' ),
					text: __(
						'The VaultPress API could not recognize the site ID associated with your site, or multiple site ID’s are associated with the same site domain.',
						'jetpack-my-jetpack'
					),
				};
			// Last backup errors:
			case 'no-credentials': // This error is depreciated, now that all backups work via http only.
				return {
					title: __( 'No credentials found', 'jetpack-my-jetpack' ),
					text: __(
						'No remote server credentials were found. Please add your website’s server credentials in Backup settings so Backup can fully function properly.',
						'jetpack-my-jetpack'
					),
				};
			case 'no-credentials-atomic': // This error is depreciated, and an extreeeeemely rare edge case scenario.
				return {
					title: __( 'No credentials (Atomic)', 'jetpack-my-jetpack' ),
					text: __(
						'There appears to be some issue with the Atomic API or a networking type issue. Please try again shortly to see if the issue has resolved.',
						'jetpack-my-jetpack'
					),
				};
			case 'credential-error':
				return {
					title: __( 'Backup error', 'jetpack-my-jetpack' ),
					text: __(
						'Although the site appears to be up and accessible, and remote server credentials are set, Backup still encountered an error during the last backup attempt.',
						'jetpack-my-jetpack'
					),
				};
			case 'http-only-error':
				return {
					title: __( 'Backup error', 'jetpack-my-jetpack' ),
					text: __(
						'Although the site appears to be up and accessible, Backup still encountered an error during the last backup attempt.',
						'jetpack-my-jetpack'
					),
				};
			case 'not-accessible':
				return {
					title: __( 'Site unavailable', 'jetpack-my-jetpack' ),
					text: __(
						'Backup was unable to access your site during the last backup attempt. This could be due to networking issues, a block from your host, or other server issues.',
						'jetpack-my-jetpack'
					),
				};
			case 'Kill switch active':
			case 'backups-deactivated':
				return {
					title: __( 'Backup is deactivated', 'jetpack-my-jetpack' ),
					text: __(
						'It appears that the backups have been manually deactivated for the site.',
						'jetpack-my-jetpack'
					),
				};
			case 'error':
				return {
					title: __( 'Backup system error', 'jetpack-my-jetpack' ),
					text: __(
						'Backup has encountered a general system error and was unable to complete the last backup attempt.',
						'jetpack-my-jetpack'
					),
				};
			default: {
				if ( ! status ) {
					return {
						title: null,
						text: null,
					};
				}
				const statusTitleSplit = status.split( /[_\s-]/ );
				statusTitleSplit[ 0 ] =
					statusTitleSplit[ 0 ].charAt( 0 ).toUpperCase() + statusTitleSplit[ 0 ].slice( 1 );
				const statusTitle = statusTitleSplit.join( ' ' );
				return {
					title: sprintf(
						// translators: %s is the error code coming from the server (formatted, i.e.- first word capitalized, hypen's removed, etc. ) i.e.- 'Invalid credentials', 'File not found', etc.
						__( '%s error', 'jetpack-my-jetpack' ),
						statusTitle
					),
					text: sprintf(
						// translators: %s is the error code coming from the server. i.e.- 'invalid-credentials', 'file-not-found', etc.
						__( 'Error code: %s', 'jetpack-my-jetpack' ),
						status
					),
				};
			}
		}
	}, [ status ] );

	return {
		isLoading: isRedBubbleAlertsLoading,
		reasonContent: reasonContent,
	};
};

export default useGetReadableFailedBackupReason;
