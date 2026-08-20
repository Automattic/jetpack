import './style.scss';

/**
 * Who the comment will be attributed to.
 *
 * @return The identity line, or nothing when there is no logged-in user.
 */
export const CommentingAs = () => {
	const { user, strings } = JetpackComments;

	if ( ! user ) {
		return null;
	}

	return (
		<div className="jetpack-comments__user">
			{ user.avatarUrl && (
				<img
					className="jetpack-comments__avatar"
					src={ user.avatarUrl }
					alt=""
					width="24"
					height="24"
				/>
			) }
			<span className="jetpack-comments__user-name">
				{ strings.commentingAs.replace( '%s', user.displayName ) }
			</span>
			<a className="jetpack-comments__logout" href={ user.logoutUrl }>
				{ strings.logOut }
			</a>
		</div>
	);
};
