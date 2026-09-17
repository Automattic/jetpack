import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { SignedIn } from './signed-in';
import type { CurrentUser } from '../shared/types';

type SiteUserProps = {
	user: CurrentUser;
};

/**
 * A reader logged in to the site itself. Their name comes from the site, and
 * so does the way out.
 *
 * @param props      - Component props.
 * @param props.user - The site's account.
 * @return The tray contents.
 */
export const SiteUser = ( { user }: SiteUserProps ) => {
	const { formSettings } = useContext( CommentSignals );
	const { strings } = JetpackComments;

	return (
		<SignedIn
			heading={
				<>
					<span className="jetpack-comments__signed-in-name">{ user.commentingAs }</span>{ ' ' }
					<a className="jetpack-comments__logout" href={ formSettings.logoutUrl }>
						{ strings.logOut }
					</a>
				</>
			}
		/>
	);
};
