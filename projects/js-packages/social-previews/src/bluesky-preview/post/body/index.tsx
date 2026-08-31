import { blueskyBody, blueskyUrl } from '../../helpers';
import type { BlueskyPreviewProps } from '../../types';

import './styles.scss';

type Props = BlueskyPreviewProps & { children?: React.ReactNode };

const BlueskyPostBody: React.FC< Props > = ( {
	customText,
	url,
	children,
	appendUrl,
	hyperlinks,
} ) => {
	const showUrl = appendUrl && !! url && ! customText?.includes( url );

	return (
		<div className="bluesky-preview__body">
			{ customText ? (
				<>
					<div>{ blueskyBody( customText, { reserveUrlSpace: showUrl, hyperlinks } ) }</div>
					{ showUrl ? (
						<>
							<br />
							<a href={ url } target="_blank" rel="noreferrer noopener">
								{ blueskyUrl( url.replace( /^https?:\/\//, '' ) ) }
							</a>
						</>
					) : null }
				</>
			) : null }
			{ children }
		</div>
	);
};

export default BlueskyPostBody;
