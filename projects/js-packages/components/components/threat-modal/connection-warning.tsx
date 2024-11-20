import { Text, Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import styles from './styles.module.scss';

/**
 * ConnectionWarning component
 *
 * @param {object}   props                        - The component props.
 * @param {string}   props.title                  - The title of the warning.
 * @param {string}   props.content                - The content of the warning.
 * @param {Function} props.handleConnectUser      - Function to handle the user connection process.
 * @param {boolean}  props.userIsConnecting       - Whether the user connection process is in progress.
 * @param {boolean}  props.credentialsIsFetching  - Whether the credentials are being fetched.
 * @param {string}   props.credentialsRedirectUrl - The URL to redirect the user to set credentials.
 *
 * @return {JSX.Element} The rendered ConnectionWarning component.
 */
const ConnectionWarning = ( {
	title,
	content,
	handleConnectUser,
	userIsConnecting,
	credentialsRedirectUrl,
	credentialsIsFetching,
}: {
	title: string;
	content: string;
	handleConnectUser?: () => void;
	userIsConnecting?: boolean;
	credentialsRedirectUrl?: string;
	credentialsIsFetching?: boolean;
} ): JSX.Element => {
	return (
		<Notice
			status="warning"
			isDismissible={ false }
			children={
				<div className={ styles.notice }>
					<div className={ styles.notice__title }>
						<Icon icon={ warning } size={ 30 } />
						<Text variant="title-small" mb={ 2 }>
							{ title }
						</Text>
					</div>
					<Text mb={ 2 }>{ content }</Text>
					<div className={ styles.notice__actions }>
						{ handleConnectUser && (
							<Button
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

export default ConnectionWarning;
