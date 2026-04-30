import { hasTag, preparePreviewText } from '../helpers';
import { ExpandableText } from '../shared/expandable-text';
import { CUSTOM_TEXT_LENGTH } from './helpers';

type Props = {
	text: string;
	url: string;
	forceUrlDisplay?: boolean;
};

const CustomText: React.FC< Props > = ( { text, url, forceUrlDisplay } ) => {
	let postLink;

	const showPostLink =
		hasTag( text, 'a' ) || ( forceUrlDisplay && !! url && ! text.includes( url ) );

	if ( showPostLink ) {
		postLink = (
			<a
				className="facebook-preview__custom-text-post-url"
				href={ url }
				rel="nofollow noopener noreferrer"
				target="_blank"
			>
				{ url }
			</a>
		);
	}

	return (
		<p className="facebook-preview__custom-text">
			<span>
				<ExpandableText text={ text }>
					{ visibleText =>
						preparePreviewText( visibleText, {
							platform: 'facebook',
							maxChars: CUSTOM_TEXT_LENGTH,
						} )
					}
				</ExpandableText>
			</span>
			{ postLink }
		</p>
	);
};

export default CustomText;
