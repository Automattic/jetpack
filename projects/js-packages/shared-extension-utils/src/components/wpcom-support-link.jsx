import { useDispatch } from '@wordpress/data';
import { Link } from '@wordpress/ui';
import { forwardRef } from 'react';

/**
 * @typedef {object} WpcomSupportLinkProps
 * @property {string}                    supportLink   - Support link URL.
 * @property {number}                    supportPostId - Support post ID.
 * @property {import('react').ReactNode} [children]    - Support link content.
 * @property {Function}                  [onClick]     - Callback function to be called when the link is clicked.
 * @property {object}                    [style]       - CSS properties to be applied to the link.
 */

export const WpcomSupportLink = forwardRef(
	/**
	 * Renders a link that opens a WP.com support article in the Help Center.
	 *
	 * @param {WpcomSupportLinkProps}                  props - The component props.
	 * @param {import('react').Ref<HTMLAnchorElement>} ref   - Forwarded ref.
	 * @return {import('react').JSX.Element} The component to render.
	 */
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
			<Link openInNewTab href={ supportLink } onClick={ onClick } style={ style } ref={ ref }>
				{ children }
			</Link>
		);
	}
);
