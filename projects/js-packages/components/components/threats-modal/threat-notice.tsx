import { Notice, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import { useContext } from 'react';
import { Text, Button } from '@automattic/jetpack-components';
import styles from './styles.module.scss';
import { ThreatsModalContext } from '.';

/**
 * ThreatNotice component
 *
 * @param {object}             props             - The component props.
 * @param {string}             props.status      - The status of the notice.
 * @param {string}             props.title       - The title of the notice.
 * @param {string|JSX.Element} props.content     - The content of the notice.
 * @param {boolean}            props.showActions - Whether to show the actions or not.
 *
 * @return {JSX.Element} The rendered ThreatNotice component.
 */
const ThreatNotice = ( {
	status = 'warning',
	title,
	content,
	showActions = true,
}: {
	status?: 'warning' | 'error' | 'success' | undefined;
	title: string;
	content: string | JSX.Element;
	showActions?: boolean;
} ): JSX.Element => {
	const {
		currentThreats,
		isSingleThreat,
		userConnectionNeeded,
		userIsConnecting,
		handleConnectUser,
		siteCredentialsNeeded,
		credentialsRedirectUrl,
		credentialsIsFetching,
	} = useContext( ThreatsModalContext );

	if (
		currentThreats.every( threat => ! threat?.status ) ||
		( isSingleThreat && currentThreats[ 0 ].status === 'fixed' )
	) {
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
					{ showActions && (
						<div className={ styles.notice__actions }>
							{ userConnectionNeeded && (
								<Button
									className={ styles.notice__action }
									isExternalLink={ true }
									weight="regular"
									isLoading={ userIsConnecting }
									onClick={ handleConnectUser }
								>
									{ __( 'Connect your user account', 'jetpack-components' ) }
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
									{ __( 'Enter server credentials', 'jetpack-components' ) }
								</Button>
							) }
						</div>
					) }
				</div>
			}
		/>
	);
};

export default ThreatNotice;
