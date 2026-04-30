import { useDispatch } from '@wordpress/data';
import { forwardRef, useCallback } from '@wordpress/element';
import { Link } from '@wordpress/ui';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';

type Props = {
	supportLink: string;
	supportPostId?: number;
	children?: ReactNode;
	onClick?: () => void;
	style?: CSSProperties;
};

/**
 * Renders a link that opens a WP.com support article in the Help Center when
 * the help-center store is available, falling back to a WPDS `Link` (with
 * `openInNewTab`) otherwise.
 *
 * Inlined locally so the wp-build settings route doesn't have to pull in
 * `@automattic/jetpack-shared-extension-utils/components`, whose index
 * transitively imports `@automattic/jetpack-components` (heavy).
 */
const WpcomSupportLink = forwardRef< HTMLAnchorElement, Props >(
	( { supportLink, supportPostId, children, onClick, style }, ref ) => {
		const helpCenterDispatch = useDispatch( 'automattic/help-center' ) as
			| { setShowSupportDoc?: ( link: string, postId?: number ) => void }
			| undefined;
		const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

		const handleClick = useCallback(
			( event: MouseEvent< HTMLAnchorElement > ) => {
				event.preventDefault();
				onClick?.();
				setShowSupportDoc?.( supportLink, supportPostId );
			},
			[ onClick, setShowSupportDoc, supportLink, supportPostId ]
		);

		if ( setShowSupportDoc ) {
			return (
				<a href={ supportLink } onClick={ handleClick } style={ style } ref={ ref }>
					{ children }
				</a>
			);
		}

		return (
			<Link href={ supportLink } onClick={ onClick } openInNewTab style={ style }>
				{ children }
			</Link>
		);
	}
);

export default WpcomSupportLink;
