import { hasLoginFailed } from '../shared/identity';

import './style.scss';

export { CommentingAs } from './commenting-as';

/**
 * The form asks nothing of the reader up front: WordPress.com establishes who
 * they are when they submit. All that is drawn here is the apology when that
 * fails; the attribution line lives in the footer.
 *
 * @return The error line, or nothing.
 */
export const Identity = () => {
	const { strings } = JetpackComments;

	return hasLoginFailed.value ? (
		<p className="jetpack-comments__login-error" role="alert">
			{ strings.loginError }
		</p>
	) : null;
};
