import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { WpcomSupportLink } from '@automattic/jetpack-shared-extension-utils/components/wpcom-support-link';
import { dispatch } from '@wordpress/data';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';

/**
 * Inline support link.
 *
 * On WordPress.com (Simple/Atomic) sites with a `wpcomLink`, it opens the
 * WordPress.com support doc inside the Help Center. Everywhere else it opens
 * `href` (usually a jetpack.com doc) in a new tab.
 *
 * @param {object} props             - Component props.
 * @param {string} props.href        - Link used outside WordPress.com.
 * @param {string} props.wpcomLink   - wordpress.com/support URL used on WordPress.com sites.
 * @param {number} props.wpcomPostId - Support post ID matching `wpcomLink`.
 * @param {*}      props.children    - Link content.
 * @return {import('react').JSX.Element} The link.
 */
export default function SupportLink( { href, wpcomLink, wpcomPostId, children, ...props } ) {
	if ( wpcomLink && isWpcomPlatformSite() ) {
		return (
			<WpcomSupportLink supportLink={ wpcomLink } supportPostId={ wpcomPostId } { ...props }>
				{ children }
			</WpcomSupportLink>
		);
	}

	return (
		<Link openInNewTab href={ href } rel="noopener noreferrer" { ...props }>
			{ children }
		</Link>
	);
}

SupportLink.propTypes = {
	href: PropTypes.string,
	wpcomLink: PropTypes.string,
	wpcomPostId: PropTypes.number,
	children: PropTypes.node,
};

/**
 * Pick the support doc URL for the current site.
 *
 * @param {string} href      - Link used outside WordPress.com.
 * @param {string} wpcomLink - wordpress.com/support URL used on WordPress.com sites.
 * @return {string} The URL to link to.
 */
export function getSupportUrl( href, wpcomLink ) {
	return wpcomLink && isWpcomPlatformSite() ? wpcomLink : href;
}

/**
 * Click handler for non-`SupportLink` elements (e.g. a Card) that point at a
 * support doc: on WordPress.com sites, open the doc in the Help Center when
 * it is available instead of following the link.
 *
 * @param {Event}  event     - Click event.
 * @param {string} wpcomLink - wordpress.com/support URL.
 * @param {number} [postId]  - Support post ID matching `wpcomLink`.
 */
export function openWpcomSupportDoc( event, wpcomLink, postId ) {
	if ( ! wpcomLink || ! isWpcomPlatformSite() ) {
		return;
	}

	const setShowSupportDoc = dispatch( 'automattic/help-center' )?.setShowSupportDoc;
	if ( setShowSupportDoc ) {
		event.preventDefault();
		setShowSupportDoc( wpcomLink, postId );
	}
}
