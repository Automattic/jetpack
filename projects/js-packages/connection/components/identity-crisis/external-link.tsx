import { Link } from '@wordpress/ui';
import styles from './styles.module.scss';
import type { ReactNode } from 'react';

/**
 * A link that opens in a new tab; `Link` underlines its text, but not its icon.
 *
 * @param {object}    props          - Component props.
 * @param {string}    props.href     - Where it goes.
 * @param {ReactNode} props.children - The link text.
 * @return {ReactNode} The link.
 */
export default function ExternalLink( {
	href,
	children,
}: {
	href: string;
	children?: ReactNode;
} ): ReactNode {
	return (
		// `Link` sets no `rel` for a new tab.
		<Link
			href={ href }
			openInNewTab
			rel="noopener noreferrer"
			className={ styles[ 'external-link' ] }
		>
			{ children }
		</Link>
	);
}
