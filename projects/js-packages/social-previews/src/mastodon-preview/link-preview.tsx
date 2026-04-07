import MastodonPostActions from './post/actions';
import MastodonPostCard from './post/card';
import MastodonPostHeader from './post/header';
import type { MastodonPreviewProps } from './types';

import './styles.scss';

export const MastodonLinkPreview: React.FC< MastodonPreviewProps > = props => {
	const { user } = props;

	return (
		<div className="mastodon-preview__post">
			<MastodonPostHeader user={ user } />
			<MastodonPostCard { ...props } customImage="" />
			<MastodonPostActions />
		</div>
	);
};
