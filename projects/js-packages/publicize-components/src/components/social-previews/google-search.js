import { GoogleSearchPreview } from '@automattic/social-previews';
import { useSelect } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * The Google Search tab component.
 *
 * @param {object}   props        - The props.
 * @param {object[]} props.tweets - The tweets.
 * @param {object}   props.media  - The media.
 * @return {import('react').ReactNode} The Google Search tab component.
 */
export function GoogleSearch( props ) {
	const siteTitle = useSelect( select => {
		const { getUnstableBase } = select( 'core' );

		const siteName = getUnstableBase().name;

		return decodeEntities( siteName );
	} );

	return <GoogleSearchPreview { ...props } siteTitle={ siteTitle } />;
}

export default GoogleSearch;
