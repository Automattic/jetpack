import { ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { forwardRef } from 'react';

/**
 * Renders a link that opens a WP.com support article in the Help Center.
 *
 * @param {object}                    props               - The component props.
 * @param {string}                    props.supportLink   - Support link URL.
 * @param {number}                    props.supportPostId - Support post ID.
 * @param {import('react').Component} props.children      - Support link content.
 * @param {Function}                  [props.onClick]     - Callback function to be called when the link is clicked.
 * @param {object}                    [props.style]       - CSS properties to be applied to the link.
 * @return {import('react').JSX.Element} The component to render.
 */
export const WpcomSupportLink = forwardRef(
	( { supportLink, supportPostId, children, onClick, style }, ref ) => {
		const helpCenterDispatch = useDispatch( 'automattic/help-center' );
		const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

		if ( setShowSupportDoc ) {
			return (
				<a
					href={ supportLink }
					// eslint-disable-next-line react/jsx-no-bind
					onClick={ event => {
						event.preventDefault();
						onClick?.();
						setShowSupportDoc( supportLink, supportPostId );
					} }
					style={ style }
					ref={ ref }
				>
					{ children }
				</a>
			);
		}
		return (
			<ExternalLink href={ supportLink } onClick={ onClick } style={ style } ref={ ref }>
				{ children }
			</ExternalLink>
		);
	}
);
