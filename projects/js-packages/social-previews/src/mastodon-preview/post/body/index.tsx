import { stripHtmlTags } from '../../../helpers';
import { ExpandableText } from '../../../shared/expandable-text';
import { getMastodonAddressDetails, mastodonBody, mastodonUrl } from '../../helpers';
import type { MastodonPreviewProps } from '../../types';

import './styles.scss';

type Props = MastodonPreviewProps & { children?: React.ReactNode };

const MastonPostBody: React.FC< Props > = props => {
	const { title, description, customText, url, user, children } = props;
	const instance = user?.address ? getMastodonAddressDetails( user.address ).instance : '';

	// When the custom message already contains the URL (e.g. via the {url}
	// placeholder), it gets auto-linked within the body, so appending it again
	// below would show the URL twice — and the body should not reserve extra
	// room for a separate URL link that isn't rendered.
	const urlInBody = Boolean( customText && url && customText.includes( url ) );

	const options = {
		instance,
		offset: 0,
		reserveUrlSpace: ! urlInBody,
	};

	let bodyTxt;

	if ( customText ) {
		bodyTxt = (
			<p>
				<ExpandableText text={ customText }>
					{ visibleText => mastodonBody( visibleText, options ) }
				</ExpandableText>
			</p>
		);
	} else if ( description ) {
		if ( title ) {
			const renderedTitle = stripHtmlTags( title );

			options.offset = renderedTitle.length;

			bodyTxt = (
				<>
					<p>{ renderedTitle }</p>
					<p>
						<ExpandableText text={ description }>
							{ visibleText => mastodonBody( visibleText, options ) }
						</ExpandableText>
					</p>
				</>
			);
		} else {
			bodyTxt = (
				<p>
					<ExpandableText text={ description }>
						{ visibleText => mastodonBody( visibleText, options ) }
					</ExpandableText>
				</p>
			);
		}
	} else {
		bodyTxt = <p>{ mastodonBody( title, options ) }</p>;
	}

	return (
		<div className="mastodon-preview__body">
			{ bodyTxt }
			{ ! urlInBody && (
				<a href={ url } target="_blank" rel="noreferrer noopener">
					{ mastodonUrl( url.replace( /^https?:\/\//, '' ) ) }
				</a>
			) }
			{ children }
		</div>
	);
};

export default MastonPostBody;
