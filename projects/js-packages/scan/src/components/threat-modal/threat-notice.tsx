import { Text, Button } from '@automattic/jetpack-components';
import { Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import { useContext } from 'react';
import styles from './styles.module.scss';
import { ThreatModalContext } from './index.js';

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
	const {
		userConnectionNeeded,
		userIsConnecting,
		handleConnectUser,
		siteCredentialsNeeded,
		credentialsRedirectUrl,
		credentialsIsFetching,
	} = useContext( ThreatModalContext );

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
								isLoading={ userIsConnecting }
								onClick={ handleConnectUser }
							>
								{ __( 'Connect your user account', 'jetpack-scan' ) }
							</Button>
						) }
						{ siteCredentialsNeeded && (
							<Button
								className={ styles.notice__action }
								isExternalLink={ true }
								weight="regular"
								href={ credentialsRedirectUrl }
								isLoading={ credentialsIsFetching }
							>
								{ __( 'Enter server credentials', 'jetpack-scan' ) }
							</Button>
						) }
					</div>
				</div>
			}
		/>
	);
};

export default ThreatNotice;
