import { Card } from './card';
import { Footer } from './footer';
import { Header } from './header';
import { Media } from './media';
import { QuoteTweet } from './quote-tweet';
import { Sidebar } from './sidebar';
import { Text } from './text';
import { TwitterPreviewProps } from './types';

import './style.scss';

export const TwitterPostPreview: React.FC< TwitterPreviewProps > = ( {
	date,
	description,
	image,
	imageFocalPoint,
	media,
	name,
	profileImage,
	screenName,
	showThreadConnector,
	text,
	title,
	tweetUrl,
	cardType,
	url,
} ) => {
	const hasMedia = !! media?.length;

	return (
		<div className="twitter-preview__wrapper">
			<div className="twitter-preview__container">
				<Sidebar profileImage={ profileImage } showThreadConnector={ showThreadConnector } />
				<div className="twitter-preview__main">
					<Header name={ name } screenName={ screenName } date={ date } />
					<div className="twitter-preview__content">
						{ text ? <Text text={ text } /> : null }
						{ hasMedia ? <Media media={ media } /> : null }
						{ tweetUrl ? <QuoteTweet tweetUrl={ tweetUrl } /> : null }
						{ ! hasMedia && url && (
							<Card
								description={ description || '' }
								image={ image }
								imageFocalPoint={ imageFocalPoint }
								title={ title || '' }
								cardType={ cardType || '' }
								url={ url }
							/>
						) }
					</div>
					<Footer />
				</div>
			</div>
		</div>
	);
};
