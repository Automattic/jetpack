import { stripHtmlTags } from '../../../helpers';
import { ExpandableText } from '../../../shared/expandable-text';
import { MessageSkeleton } from '../../../shared/message-skeleton';
import { getMastodonAddressDetails, mastodonBody, mastodonUrl } from '../../helpers';
import type { MastodonPreviewProps } from '../../types';

import './styles.scss';

type Props = MastodonPreviewProps & { children?: React.ReactNode };

const MastonPostBody: React.FC< Props > = props => {
	const { title, description, customText, url, user, children, isLoading } = props;
	const instance = user?.address ? getMastodonAddressDetails( user.address ).instance : '';
	const options = {
		instance,
		offset: 0,
	};

	let bodyTxt;

	if ( isLoading ) {
		bodyTxt = <MessageSkeleton lines={ 2 } />;
	} else if ( customText ) {
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
			<a href={ url } target="_blank" rel="noreferrer noopener">
				{ mastodonUrl( url.replace( /^https?:\/\//, '' ) ) }
			</a>
			{ children }
		</div>
	);
};

export default MastonPostBody;
