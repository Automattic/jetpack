import { useContext } from 'preact/hooks';
import { identityUser } from '../shared/identity';
import { CommentSignals } from '../shared/state';
import { heldCode } from './checkpoint/code';
import { disconnect } from './checkpoint/connect';

import './style.scss';

/**
 * Who the comment will be attributed to. A held code rides along in a hidden
 * field. Logging out of a checkpoint identity clears the cookie in place;
 * logging out of a site account follows the usual link.
 *
 * @return The identity line, or nothing when nobody is identified.
 */
export const CommentingAs = () => {
	const { formSettings } = useContext( CommentSignals );
	const { strings, checkpoint } = JetpackComments;
	const user = identityUser.value;
	const held = heldCode.value;

	const onLogOut = async ( event: Event ) => {
		if ( ! user?.isPassport ) {
			return; // Follow the href to the site's log-out URL.
		}

		event.preventDefault();
		await disconnect();
	};

	return user ? (
		<div className="jetpack-comments__user">
			{ /* Readable by any script on the page, but such a script could already
			     submit this form as the reader, and a native POST has no other way
			     to carry the code. */ }
			{ user.isPassport && held && checkpoint.enabled && (
				<input type="hidden" name={ checkpoint.codeField } value={ held.code } />
			) }
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
