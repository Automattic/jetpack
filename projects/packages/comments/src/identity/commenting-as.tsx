import { useContext } from 'preact/hooks';
import { identityUser } from '../shared/identity';
import { CommentSignals } from '../shared/state';
import { heldCode } from './checkpoint/code';
import { openCheckpoint } from './checkpoint/connect';

import './style.scss';

/**
 * Who the comment will be attributed to. A held code rides along in a hidden
 * field. A WordPress.com-vouched reader can ask to be someone else, which
 * opens the checkpoint with the account choice forced; a site login follows
 * the usual log-out link.
 *
 * @return The identity line, or nothing when nobody is identified.
 */
export const CommentingAs = () => {
	const { formSettings } = useContext( CommentSignals );
	const { strings, checkpoint } = JetpackComments;
	const user = identityUser.value;
	const held = heldCode.value;

	// The rejection is already shown as the error line.
	const onNotYou = () => openCheckpoint( { prompt: true } ).catch( () => {} );

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
			{ user.commentingAs && (
				<span className="jetpack-comments__user-name">{ user.commentingAs }</span>
			) }
			{ user.isPassport ? (
				<button type="button" className="jetpack-comments__logout" onClick={ onNotYou }>
					{ strings.notYou }
				</button>
			) : (
				<a className="jetpack-comments__logout" href={ formSettings.logoutUrl }>
					{ strings.logOut }
				</a>
			) }
		</div>
	) : null;
};
