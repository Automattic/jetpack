import AdminPage from '@automattic/jetpack-components/admin-page';
import { __ } from '@wordpress/i18n';
import { Button, Stack, Text } from '@wordpress/ui';
import './style.scss';

type Props = {
	/** Starts the site-registration + user-connection flow. */
	onConnect: () => void;
	/** True while registration or user connection is in flight. */
	isConnecting: boolean;
};

/**
 * Pre-connection screen rendered in place of the dashboard when the site or the
 * current user isn't connected to WordPress.com. VideoPress can't upload or
 * manage videos without that connection, so the dashboard (and its uploader)
 * stays behind it. Reuses the same `AdminPage` chrome as `DashboardLayout` so
 * the header and footer match the connected dashboard.
 *
 * @param props              - Component props.
 * @param props.onConnect    - Starts the connection flow.
 * @param props.isConnecting - Whether the connection flow is in progress.
 * @return The connect screen element.
 */
export default function ConnectScreen( { onConnect, isConnecting }: Props ) {
	return (
		<AdminPage
			title={ 'VideoPress' /* product name; not translated */ }
			subTitle={ __( 'Professional quality, ad-free video hosting.', 'jetpack-videopress-pkg' ) }
		>
			<Stack direction="column" gap="md" className="vp-connection-gate">
				<Text variant="heading-2xl">
					{ __( 'Connect to set up VideoPress', 'jetpack-videopress-pkg' ) }
				</Text>
				<Text>
					{ __(
						'VideoPress needs a connection to WordPress.com before you can upload and manage your videos.',
						'jetpack-videopress-pkg'
					) }
				</Text>
				<div>
					<Button variant="solid" disabled={ isConnecting } onClick={ onConnect }>
						{ isConnecting
							? __( 'Connecting…', 'jetpack-videopress-pkg' )
							: __( 'Connect', 'jetpack-videopress-pkg' ) }
					</Button>
				</div>
			</Stack>
		</AdminPage>
	);
}
