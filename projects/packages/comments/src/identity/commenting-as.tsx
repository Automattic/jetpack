import clsx from 'clsx';
import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { GearIcon } from './checkpoint/icons';
import { markTraySeen } from './tray';

import './style.scss';

/**
 * Who the comment will be attributed to.
 *
 * @return The identity line for a site user, the avatar and tray toggle for a popup sign-in, or nothing.
 */
export const CommentingAs = () => {
	const { formSettings, signedIn, isTrayOpen } = useContext( CommentSignals );
	const { user, strings } = JetpackComments;

	if ( user ) {
		return (
			<div className="jetpack-comments__user">
				{ user.avatarUrl && (
					<img
						className="jetpack-comments__avatar"
						src={ user.avatarUrl }
						alt=""
						width="37"
						height="37"
					/>
				) }
				<span className="jetpack-comments__user-name">{ user.commentingAs }</span>
				<a className="jetpack-comments__logout" href={ formSettings.logoutUrl }>
					{ strings.logOut }
				</a>
			</div>
		);
	}

	if ( ! signedIn.value ) {
		return null;
	}

	const toggle = () => {
		document.querySelector< HTMLTextAreaElement >( '.jetpack-comments__textarea' )?.focus();
		markTraySeen();
		isTrayOpen.value = ! isTrayOpen.value;
	};

	return (
		<div className="jetpack-comments__user-settings">
			<span className="jetpack-comments__profile">
				<img src={ signedIn.value.avatar } alt={ signedIn.value.name } loading="lazy" />
			</span>
			<button
				type="button"
				aria-label={ strings.settings }
				aria-expanded={ isTrayOpen.value }
				className={ clsx( 'jetpack-comments__tray-toggle', { 'is-open': isTrayOpen.value } ) }
				onClick={ toggle }
			>
				<GearIcon expanded={ isTrayOpen.value } />
			</button>
		</div>
	);
};
