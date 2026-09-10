import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';

import './style.scss';

/**
 * Who the comment will be attributed to.
 *
 * @return The identity line, or nothing when there is no logged-in user.
 */
export const CommentingAs = () => {
	const { formSettings } = useContext( CommentSignals );
	const { user, strings } = JetpackComments;

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
			<a className="jetpack-comments__logout" href={ formSettings.logoutUrl }>
				{ strings.logOut }
			</a>
		</div>
	) : null;
};
