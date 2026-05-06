import { preparePreviewText } from '../helpers';
import { ExpandableText } from '../shared/expandable-text';
import { MessageSkeleton } from '../shared/message-skeleton';
import { Card } from './card';
import { Footer } from './footer';
import { Header } from './header';
import { CAPTION_MAX_CHARS } from './helpers';
import { Media } from './media';
import { Sidebar } from './sidebar';
import { ThreadsPreviewProps } from './types';

import './style.scss';

export const ThreadsPostPreview: React.FC< ThreadsPreviewProps > = ( {
	caption,
	date,
	image,
	media,
	name,
	profileImage,
	showThreadConnector,
	title,
	isLoading,
	url,
} ) => {
	const hasMedia = !! media?.length;

	const displayAsCard = url && image && ! hasMedia;
	let captionContent = null;

	if ( isLoading ) {
		captionContent = <MessageSkeleton className="threads-preview__text" />;
	} else if ( caption ) {
		captionContent = (
			<div className="threads-preview__text">
				<ExpandableText text={ caption }>
					{ visibleText =>
						preparePreviewText( visibleText, {
							platform: 'threads',
							maxChars: CAPTION_MAX_CHARS,
						} )
					}
				</ExpandableText>
			</div>
		);
	}

	return (
		<div className="threads-preview__wrapper">
			<div className="threads-preview__container">
				<Sidebar profileImage={ profileImage } showThreadConnector={ showThreadConnector } />
				<div className="threads-preview__main">
					<Header name={ name } date={ date } />
					<div className="threads-preview__content">
						{ captionContent }
						{ hasMedia ? <Media media={ media } /> : null }
						{ displayAsCard ? <Card image={ image } title={ title || '' } url={ url } /> : null }
					</div>
					<Footer />
				</div>
			</div>
		</div>
	);
};
