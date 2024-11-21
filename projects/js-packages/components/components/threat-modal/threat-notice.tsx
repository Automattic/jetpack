import { Text, Button } from '@automattic/jetpack-components';
import { type Threat } from '@automattic/jetpack-scan';
import { Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import styles from './styles.module.scss';

/**
 * ThreatNotice component
 *
 * @param {object}   props                        - The component props.
 * @param {object}   props.threat                 - The threat object containing notice details.
 * @param {string}   props.status                 - The status of the notice.
 * @param {string}   props.title                  - The title of the notice.
 * @param {string}   props.content                - The content of the notice.
 * @param {Function} props.handleConnectUser      - Function to handle the user connection process.
 * @param {boolean}  props.userIsConnecting       - Whether the user connection process is in progress.
 * @param {boolean}  props.credentialsIsFetching  - Whether the credentials are being fetched.
 * @param {string}   props.credentialsRedirectUrl - The URL to redirect the user to set credentials.
 *
 * @return {JSX.Element} The rendered ThreatNotice component.
 */
const ThreatNotice = ( {
	threat,
	status = 'warning',
	title,
	content,
	handleConnectUser,
	userIsConnecting,
	credentialsRedirectUrl,
	credentialsIsFetching,
}: {
	threat: Threat;
	status?: 'warning' | 'error' | 'success' | undefined;
	title: string;
	content: string;
	handleConnectUser?: () => void;
	userIsConnecting?: boolean;
	credentialsRedirectUrl?: string;
	credentialsIsFetching?: boolean;
} ): JSX.Element => {
	if ( ! threat?.status || threat.status === 'fixed' ) {
		return null;
	}

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
						{ handleConnectUser && (
							<Button
								className={ styles.notice__action }
								isExternalLink={ true }
								weight="regular"
								isLoading={ userIsConnecting }
								onClick={ handleConnectUser }
							>
								{ __( 'Connect your user account', 'jetpack' ) }
							</Button>
						) }
						{ credentialsRedirectUrl && (
							<Button
								className={ styles.notice__action }
								isExternalLink={ true }
								weight="regular"
								href={ credentialsRedirectUrl }
								isLoading={ credentialsIsFetching }
							>
								{ __( 'Enter server credentials', 'jetpack' ) }
							</Button>
						) }
					</div>
				</div>
			}
		/>
	);
};

export default ThreatNotice;
