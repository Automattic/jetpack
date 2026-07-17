import { AvatarWithFallback } from '../../../avatar-with-fallback';
import type { BlueskyPreviewProps } from '../../types';

import './styles.scss';

type Props = Pick< BlueskyPreviewProps, 'user' >;

export const BlueskyPostSidebar: React.FC< Props > = ( { user } ) => {
	const { avatarUrl } = user || {};

	return (
		<div className="bluesky-preview__post-sidebar">
			<div className="bluesky-preview__post-sidebar-user">
				<AvatarWithFallback className="bluesky-preview__post-avatar" src={ avatarUrl } />
			</div>
		</div>
	);
};
