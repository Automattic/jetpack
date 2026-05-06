import { MessageSkeleton } from '../../../shared/message-skeleton';
import { blueskyBody, blueskyUrl } from '../../helpers';
import type { BlueskyPreviewProps } from '../../types';

import './styles.scss';

type Props = BlueskyPreviewProps & { children?: React.ReactNode };

const BlueskyPostBody: React.FC< Props > = ( {
	customText,
	url,
	children,
	appendUrl,
	isLoading,
} ) => {
	const showUrl = appendUrl && !! url && ! customText?.includes( url );
	let bodyContent = null;

	if ( isLoading ) {
		bodyContent = <MessageSkeleton lines={ 2 } />;
	} else if ( customText ) {
		bodyContent = (
			<>
				<div>{ blueskyBody( customText, { reserveUrlSpace: showUrl } ) }</div>
				{ showUrl ? (
					<>
						<br />
						<a href={ url } target="_blank" rel="noreferrer noopener">
							{ blueskyUrl( url.replace( /^https?:\/\//, '' ) ) }
						</a>
					</>
				) : null }
			</>
		);
	}

	return (
		<div className="bluesky-preview__body">
			{ bodyContent }
			{ children }
		</div>
	);
};

export default BlueskyPostBody;
