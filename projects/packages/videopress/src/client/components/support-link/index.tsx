/**
 * External dependencies
 */
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
		| { setShowSupportDoc?: ( url: string, postId: number ) => void }
		| undefined;
	const setShowSupportDoc = helpCenter?.setShowSupportDoc;

	const supportUrl = isWpcomPlatformSite()
		? 'https://wordpress.com/support/videopress/'
		: 'https://jetpack.com/support/jetpack-videopress/';

	if ( setShowSupportDoc ) {
		return (
			<Link
				href={ supportUrl }
				onClick={ event => {
					event.preventDefault();
					setShowSupportDoc( supportUrl, SUPPORT_POST_ID );
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
