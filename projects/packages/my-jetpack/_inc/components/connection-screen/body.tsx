import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectScreen } from '@automattic/jetpack-connection';
import { VisuallyHidden } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, external } from '@wordpress/icons';
import connectImage from './connect.png';
import styles from './styles.module.scss';
import type { Props as ConnectScreenProps } from '@automattic/jetpack-connection';

const ConnectionScreenBody: React.FC< ConnectScreenProps > = props => {
	const { title } = props;

	return (
		<ConnectScreen
			buttonLabel={ __( 'Connect your user account', 'jetpack-my-jetpack' ) }
			loadingLabel={ __( 'Connecting your account…', 'jetpack-my-jetpack' ) }
			images={ [ connectImage ] }
			from="my-jetpack"
			{ ...props }
			title={
				title ||
				__( 'Unlock all the amazing features of Jetpack by connecting now', 'jetpack-my-jetpack' )
			}
		>
			{ /*
						Since the list style type is set to none, `role=list` is required for VoiceOver (on Safari) to announce the list.
						See: https://www.scottohara.me/blog/2019/01/12/lists-and-safari.html
						*/ }
			<ul role="list">
				<li>{ __( 'Receive instant downtime alerts', 'jetpack-my-jetpack' ) }</li>
				<li>{ __( 'Automatically share your content on social media', 'jetpack-my-jetpack' ) }</li>
				<li>{ __( 'Let your subscribers know when you post', 'jetpack-my-jetpack' ) }</li>
				<li>
					{ __( 'Receive notifications about new likes and comments', 'jetpack-my-jetpack' ) }
				</li>
				<li>{ __( 'Let visitors share your content on social media', 'jetpack-my-jetpack' ) }</li>
				<li>
					{ __( 'And more!', 'jetpack-my-jetpack' ) }{ ' ' }
					<a
						href={ getRedirectUrl( 'jetpack-features' ) }
						target="_blank"
						className={ styles[ 'all-features' ] }
						rel="noreferrer"
					>
						{ __( 'See all Jetpack features', 'jetpack-my-jetpack' ) }
						<Icon icon={ external } />
						<VisuallyHidden as="span">
							{
								/* translators: accessibility text */
								__( '(opens in a new tab)', 'jetpack-my-jetpack' )
							}
						</VisuallyHidden>
					</a>
				</li>
			</ul>
		</ConnectScreen>
	);
};

export default ConnectionScreenBody;
