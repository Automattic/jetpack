import './style.scss';

/**
 * Shown when the site only takes comments from registered users.
 *
 * @return The prompt, and a way to log in and come back.
 */
export const LogInPrompt = () => {
	const { loginUrl, strings } = JetpackComments;

	return (
		<div className="jetpack-comments__identity">
			<p className="jetpack-comments__prompt">{ strings.mustLogInPrompt }</p>
			<a className="jetpack-comments__login" href={ loginUrl }>
				{ strings.logIn }
			</a>
		</div>
	);
};
