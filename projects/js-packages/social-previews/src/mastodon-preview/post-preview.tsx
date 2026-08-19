import clsx from 'clsx';
import MastodonPostActions from './post/actions';
import MastonPostBody from './post/body';
import MastodonPostCard from './post/card';
import MastodonPostHeader from './post/header';
import type { MastodonPreviewProps } from './types';

import './styles.scss';

export const MastodonPostPreview: React.FC< MastodonPreviewProps > = props => {
	const { user, media } = props;

	return (
		<div className="mastodon-preview__post">
			<MastodonPostHeader user={ user } />
			<MastonPostBody { ...props }>
				{ media?.length ? (
					<div className={ clsx( 'mastodon-preview__media', { 'as-grid': media.length > 1 } ) }>
						{ media.map( ( mediaItem, index ) => (
							<div
								key={ `mastodon-preview__media-item-${ index }` }
								className="mastodon-preview__media-item"
							>
								{ mediaItem.type.startsWith( 'video/' ) ? (
									<video controls>
										<source src={ mediaItem.url } type={ mediaItem.type } />
									</video>
								) : (
									<img alt={ mediaItem.alt || '' } src={ mediaItem.url } />
								) }
							</div>
						) ) }
					</div>
				) : null }
			</MastonPostBody>
			{ ! media?.length && props.customText?.includes( props.url ) ? (
				<MastodonPostCard { ...props } />
			) : null }
			<MastodonPostActions />
		</div>
	);
};
