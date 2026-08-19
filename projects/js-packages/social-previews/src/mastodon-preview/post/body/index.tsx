import { stripHtmlTags } from '../../../helpers';
import { ExpandableText } from '../../../shared/expandable-text';
import { getMastodonAddressDetails, mastodonBody } from '../../helpers';
import type { MastodonPreviewProps } from '../../types';

import './styles.scss';

type Props = MastodonPreviewProps & { children?: React.ReactNode };

const MastonPostBody: React.FC< Props > = props => {
	const { title, description, customText, user, children } = props;
	const instance = user?.address ? getMastodonAddressDetails( user.address ).instance : '';

	const options = {
		instance,
		offset: 0,
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

	// The post URL is not appended separately: the message body (and any
	// {url} placeholder it contains) is the source of truth, so the URL is
	// only shown when it is part of the body itself.
	return (
		<div className="mastodon-preview__body">
			{ bodyTxt }
			{ children }
		</div>
	);
};

export default MastonPostBody;
