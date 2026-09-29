/**
 * External dependencies
 */
import { getRedirectUrl } from '@automattic/jetpack-components';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { useDispatch } from '@wordpress/data';
import { Link } from '@wordpress/ui';
/**
 * Types
 */
import type { ReactNode } from 'react';

type Props = {
	children?: ReactNode;
};

const SUPPORT_POST_ID = 4458;
const WPCOM_SUPPORT_URL = 'https://wordpress.com/support/videopress/';

/**
 * Links to the VideoPress support doc. WordPress.com sites open it in the Help
 * Center; everywhere else it opens the Jetpack doc in a new tab.
 *
 * @param props          - Component props.
 * @param props.children - Link text.
 * @return The link element.
 */
export default function SupportLink( { children }: Props ) {
	const helpCenter = useDispatch( 'automattic/help-center' ) as
		{ setShowSupportDoc?: ( url: string, postId: number ) => void } | undefined;
	const setShowSupportDoc = helpCenter?.setShowSupportDoc;

	const supportUrl = getRedirectUrl(
		isWpcomPlatformSite()
			? 'wpcom-videopress-admin-learn-more'
			: 'jetpack-videopress-admin-learn-more'
	);

	if ( setShowSupportDoc ) {
		return (
			<Link
				href={ supportUrl }
				onClick={ event => {
					event.preventDefault();
					// The Help Center article API requires a support URL, not a redirect URL.
					setShowSupportDoc( WPCOM_SUPPORT_URL, SUPPORT_POST_ID );
				} }
			>
				{ children }
			</Link>
		);
	}

	return (
		<Link openInNewTab href={ supportUrl }>
			{ children }
		</Link>
	);
}
