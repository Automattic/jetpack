import { createPortal, useLayoutEffect, useRef, useState } from '@wordpress/element';

/**
 * Render children in a shadow root, so wp-admin's styles stay out and the theme's tokens, set on the host, still reach in.
 * The host reads as one image, since its content is a picture of a form.
 *
 * @param {object} props          - Props.
 * @param {object} props.style    - Host style, custom properties included.
 * @param {string} props.label    - What the picture shows.
 * @param {*}      props.children - Shadow content.
 * @return {object} The host.
 */
export default function Shadow( { style, label, children } ) {
	const host = useRef( null );
	const [ root, setRoot ] = useState( null );

	useLayoutEffect( () => {
		const element = host.current;
		setRoot( element.shadowRoot ?? element.attachShadow( { mode: 'open' } ) );
	}, [] );

	return (
		<div ref={ host } style={ style } role="img" aria-label={ label }>
			{ root && createPortal( children, root ) }
		</div>
	);
}
