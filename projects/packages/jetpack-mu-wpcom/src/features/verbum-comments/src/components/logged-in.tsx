import clsx from 'clsx';
import useSubscriptionApi from '../hooks/useSubscriptionApi';
import { translate } from '../i18n';
import { Close } from '../images';
import { isTrayOpen, subscriptionSettings, userInfo } from '../state';
import { serviceData, isFastConnection } from '../utils';
import { NewCommentEmail } from './new-comment-email';
import { NewPostsEmail } from './new-posts-email';
import { NewPostsNotifications } from './new-posts-notifications';

/**
 * Replace the first occurrence of %s in a string with a parameter.
 * @param s - string to replace
 * @param param - parameter to replace with
 */
function sprintf( s: string, param: string ) {
	return s.replace( '%s', param );
}

interface LoggedInProps {
	siteId: number;
	toggleTray: () => void;
	logout: () => void;
}

export const LoggedIn = ( { toggleTray, logout }: LoggedInProps ) => {
	const { setEmailPostsSubscription, setCommentSubscription, setNotificationSubscription } =
		useSubscriptionApi();
	const { subscribeToComment, subscribeToBlog } = VerbumComments;
	const { email, notification } = subscriptionSettings.value ?? {};
	const hasSubOptions = userInfo.value.email && ( subscribeToComment || subscribeToBlog );
	let verbumLoadedEditor = 'textarea';

	if ( VerbumComments.enableBlocks ) {
		verbumLoadedEditor = isFastConnection() ? 'gutenberg' : 'textarea-slow-connection';
	}

	const handleClose = ( event: MouseEvent ) => {
		event.preventDefault();
		toggleTray();
	};

	const getUsername = () => {
		if ( VerbumComments.isJetpackCommentsLoggedIn ) {
			return `${ sprintf( translate( 'Logged in as %s' ), userInfo.value?.name ) }`;
		}
		return (
			<>
				{ userInfo.value.name }
				{ ` - ${ sprintf(
					translate( 'Logged in via %s' ),
					serviceData[ userInfo.value.service ]?.name
				) } - ` }
			</>
		);
	};

	const logoutProps = {
		href: '',
		target: '',
		onClick: logout,
	};

	// We need to use the userinfo logout URL, because it's fresh (can change after logging in mid-session).
	const baseLogoutUrl = userInfo.value.logout_url || VerbumComments.logoutURL;

	// Atomic logging out
	if ( window.location.host === 'jetpack.wordpress.com' ) {
		logoutProps.href =
			baseLogoutUrl + '&redirect_to=' + window.location.hash.match( /#parent=(.*)/ )[ 1 ];
		logoutProps.target = '_parent';
	} else {
		logoutProps.href = baseLogoutUrl + '&redirect_to=' + encodeURIComponent( window.location.href );
	}

	return (
		<div
			className={ clsx( 'verbum-subscriptions logged-in', {
				'no-options': ! hasSubOptions,
			} ) }
		>
			<div className="verbum-subscriptions__wrapper">
				<div className="verbum-subscriptions__content">
					<div className="verbum-subscriptions__heading">
						<div>
							<span className="verbum__user-name">{ getUsername() }</span>
							{ ! VerbumComments.isJetpackCommentsLoggedIn ? (
								<a
									// Make unreachable via tabbing when tray is closed.
									tabIndex={ ! isTrayOpen.value ? -1 : undefined }
									className="logout-link"
									{ ...logoutProps }
								>
									{ translate( 'Log out' ) }
								</a>
							) : null }
						</div>
						<button
							disabled={ ! isTrayOpen.value }
							onClick={ handleClose }
							className="close-button"
						>
							<span className="screen-reader-text">{ translate( 'Close' ) }</span>
							<Close />
						</button>
					</div>
					{ hasSubOptions && (
						<div className="verbum-subscriptions__options">
							{ subscribeToBlog && (
								<>
									{ userInfo.value.service === 'wordpress' && (
										<NewPostsNotifications
											handleOnChange={ setNotificationSubscription }
											isChecked={ notification?.send_posts }
											disabled={ ! isTrayOpen.value }
										/>
									) }
									<NewPostsEmail
										disabled={ ! isTrayOpen.value }
										handleOnChange={ setEmailPostsSubscription }
										isChecked={ email?.send_posts }
										selectedOption={ email?.post_delivery_frequency }
									/>
								</>
							) }
							{ subscribeToComment && (
								<NewCommentEmail
									disabled={ ! isTrayOpen.value }
									handleOnChange={ setCommentSubscription }
									isChecked={ email?.send_comments }
								/>
							) }
						</div>
					) }

					<div className="verbum-user__submit__identity">
						<input type="hidden" name="hc_post_as" value={ userInfo.value.service } />
						<input type="hidden" name="hc_avatar" value={ userInfo.value.avatar } />
						<input type="hidden" name="author" value={ userInfo.value.name } />
						<input type="hidden" name="email" value={ userInfo.value.email } />
						<input type="hidden" name="url" value={ userInfo.value.link } />
						<input type="hidden" name="hc_access_token" value={ userInfo.value.access_token } />
						<input type="hidden" name="hc_userid" value={ userInfo.value.uid } />
						<input type="hidden" name="verbum_loaded_editor" value={ verbumLoadedEditor } />
					</div>
				</div>
			</div>
		</div>
	);
};
