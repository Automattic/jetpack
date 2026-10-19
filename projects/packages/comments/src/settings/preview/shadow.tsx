/* @jsxImportSource react */
import { createPortal, useLayoutEffect, useRef, useState } from '@wordpress/element';
import type { CSSProperties, ReactNode } from 'react';

type ShadowProps = {
	/** Host style, custom properties included. */
	style: CSSProperties;
	/** What the picture shows. */
	label: string;
	children: ReactNode;
};

/**
 * Render children in a shadow root, so wp-admin's styles stay out and the theme's tokens, set on the host, still reach in.
 * The host reads as one image, since its content is a picture of a form.
 *
 * @param {ShadowProps} props - Props.
 * @return {JSX.Element} The host.
 */
export default function Shadow( { style, label, children }: ShadowProps ) {
	const host = useRef< HTMLDivElement >( null );
	const [ root, setRoot ] = useState< ShadowRoot | null >( null );

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
