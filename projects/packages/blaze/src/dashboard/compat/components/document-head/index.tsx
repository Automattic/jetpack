// Ported from wp-calypso client/components/data/document-head.
import { useEffect } from 'react';

export interface DocumentHeadProps {
	title?: string;
}

const SEPARATOR = ' ‹ ';

/**
 * Prefix `document.title` with `title`, keeping wp-admin's suffix, and restore it on unmount.
 *
 * @param props       - Component props.
 * @param props.title - Page title.
 * @return Nothing.
 */
export default function DocumentHead( { title }: DocumentHeadProps ) {
	useEffect( () => {
		if ( ! title ) {
			return;
		}
		const previous = document.title;
		const index = previous.indexOf( SEPARATOR );
		const suffix = index === -1 ? previous : previous.slice( index + SEPARATOR.length );
		document.title = suffix ? `${ title }${ SEPARATOR }${ suffix }` : title;

		return () => {
			document.title = previous;
		};
	}, [ title ] );

	return null;
}
