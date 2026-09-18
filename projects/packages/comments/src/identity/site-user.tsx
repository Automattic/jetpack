import { useContext } from 'preact/hooks';
import { CommentSignals } from '../shared/state';
import { SignedIn } from './signed-in';
import type { CurrentUser } from '../shared/types';

type SiteUserProps = {
	user: CurrentUser;
};

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
