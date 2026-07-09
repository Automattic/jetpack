import { useLinkProps } from '@wordpress/route';
import { Link } from '@wordpress/ui';
import type { ReactElement, ReactNode } from 'react';

type Props = {
	to: string;
	children: ReactNode;
};

/**
 * Video title link used inside the Overview's ranking cards. Combines
 * client-side navigation (TanStack's `useLinkProps` via `@wordpress/route`)
 * with `@wordpress/ui`'s `<Link>` in `tone="neutral"` + `variant="unstyled"`
 * so the row labels match the Stats dashboard treatment (no underline,
 * inherit color).
 *
 * Tags the navigation with `state: { from: 'overview' }` so the Video
 * details breadcrumb can route its "VideoPress" parent link back to
 * Overview instead of defaulting to Library.
 *
 * @param props          - Component props.
 * @param props.to       - Target route path, e.g. `/video/123`.
 * @param props.children - Visible label.
 * @return The wrapped link element.
 */
export default function VideoTitleLink( { to, children }: Props ): ReactElement {
	const linkProps = useLinkProps( { to, state: { from: 'overview' } as never } );

	return (
		<Link tone="neutral" variant="unstyled" { ...linkProps }>
			{ children }
		</Link>
	);
}
