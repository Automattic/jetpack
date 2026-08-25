import { useContext } from 'preact/hooks';
import { identityUser } from '../shared/identity';
import { CommentSignals } from '../shared/state';
import { disconnect } from './checkpoint/connect';

import './style.scss';

/**
 * Who the comment will be attributed to, shown in the footer for a reader who is
 * logged in or signed in through the checkpoint. Logging out of a checkpoint identity
 * clears the site's cookie and drops back to the guest form in place; logging
 * out of a site account follows the usual link.
 *
 * @return The identity line, or nothing when nobody is identified.
 */
export const CommentingAs = () => {
	const { formSettings } = useContext( CommentSignals );
	const { strings } = JetpackComments;
	const user = identityUser.value;

	const onLogOut = async ( event: Event ) => {
		if ( ! user?.isPassport ) {
			return; // Follow the href to the site's log-out URL.
		}

		event.preventDefault();
		await disconnect();
	};

	return user ? (
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
			<a
				className="jetpack-comments__logout"
				href={ user.isPassport ? '#' : formSettings.logoutUrl }
				onClick={ onLogOut }
			>
				{ strings.logOut }
			</a>
		</div>
	) : null;
};
