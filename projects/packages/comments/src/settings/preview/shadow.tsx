/* @jsxImportSource react */
import { createPortal, useLayoutEffect, useRef, useState } from '@wordpress/element';
import type { CSSProperties, JSX, ReactNode } from 'react';

/**
 * Render children in a shadow root, so wp-admin's styles stay out and the theme's tokens, set on the host, still reach in.
 * The host reads as one image, since its content is a picture of a form.
 *
 * @param props          - Props.
 * @param props.style    - Host style, custom properties included.
 * @param props.label    - What the picture shows.
 * @param props.children - Shadow content.
 * @return The host.
 */
export function Shadow( {
	style,
	label,
	children,
}: {
	style?: CSSProperties;
	label: string;
	children: ReactNode;
} ): JSX.Element {
	const host = useRef< HTMLDivElement >( null );
	const [ root, setRoot ] = useState< ShadowRoot | null >( null );

	useLayoutEffect( () => {
		const element = host.current!;
		setRoot( element.shadowRoot ?? element.attachShadow( { mode: 'open' } ) );
	}, [] );

	return (
		<div ref={ host } style={ style } role="img" aria-label={ label }>
			{ root && createPortal( children, root ) }
		</div>
	);
}
