import { ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import React, { forwardRef } from 'react';

/**
 * Renders a link that opens a WP.com support article in the Help Center.
 *
 * @param {object}   props           - The component props.
 * @param {string}   props.url       - Support link URL.
 * @param {number}   props.postId    - Post ID.
 * @param {string}   props.text      - Support link text.
 * @param {Function} [props.onClick] - Callback function to be called when the link is clicked.
 * @param {object}   [props.style]   - CSS properties to be applied to the link.
 * @return {React.JSX.Element} The component to render.
 */
export const WpcomSupportLink = forwardRef( ( { url, postId, text, onClick, style }, ref ) => {
	const helpCenterDispatch = useDispatch( 'automattic/help-center' );
	const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

	const Link = setShowSupportDoc ? 'a' : ExternalLink;

	return (
		<Link
			href={ url }
			// eslint-disable-next-line react/jsx-no-bind
			onClick={ event => {
				onClick?.();
				if ( setShowSupportDoc ) {
					event.preventDefault();
					setShowSupportDoc( url, postId );
				}
			} }
			style={ style }
			ref={ ref }
		>
			{ text }
		</Link>
	);
} );
