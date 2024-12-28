import { Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import { useContext } from 'react';
import { Text, Button } from '@automattic/jetpack-components';
import styles from './styles.module.scss';
import { ThreatModalContext } from '.';

/**
 * ThreatNotice component
 *
 * @param {object} props         - The component props.
 * @param {string} props.status  - The status of the notice.
 * @param {string} props.title   - The title of the notice.
 * @param {string} props.content - The content of the notice.
 *
 * @return {JSX.Element} The rendered ThreatNotice component.
 */
const ThreatNotice = ( {
	status = 'warning',
	title,
	content,
}: {
	status?: 'warning' | 'error' | 'success' | undefined;
	title: string;
	content: string;
} ): JSX.Element => {
	const { connection, credentials } = useContext( ThreatModalContext );
	const userConnectionNeeded = ! connection.isUserConnected || ! connection.hasConnectedOwner;

	return (
		<Notice
			status={ status }
			isDismissible={ false }
			children={
				<div className={ styles.notice }>
					<div className={ styles.notice__title }>
						{ status === 'success' ? (
							<Spinner className={ styles.spinner } />
						) : (
							<Icon icon={ warning } size={ 30 } />
						) }
						<Text variant="title-small" mb={ 2 }>
							{ title }
						</Text>
					</div>
					<Text>{ content }</Text>
					<div className={ styles.notice__actions }>
						{ userConnectionNeeded && (
							<Button
								className={ styles.notice__action }
								isExternalLink={ true }
								weight="regular"
								isLoading={ connection.userIsConnecting }
								onClick={ connection.onConnectUser }
							>
								{ __( 'Connect your user account', 'jetpack-components' ) }
							</Button>
						) }
						{ ! credentials.hasCredentials && (
							<Button
								className={ styles.notice__action }
								isExternalLink={ true }
								weight="regular"
								href={ credentials.redirectUrl }
								isLoading={ credentials.isFetching }
							>
								{ __( 'Enter server credentials', 'jetpack-components' ) }
							</Button>
						) }
					</div>
				</div>
			}
		/>
	);
};

export default ThreatNotice;
