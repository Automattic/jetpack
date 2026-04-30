import { addQueryArgs } from '@wordpress/url';

type Props = {
	avatarUrl?: string;
	email?: string;
	displayName?: string;
	size?: number;
	className?: string;
};

const FALLBACK_HOST = 'https://0.gravatar.com/avatar/00000000000000000000000000000000';

/**
 * Resolve the rendered avatar URL — falls back to a Gravatar mystery-man
 * placeholder when the row's `avatar` is missing, and forces the rendered
 * size via the `s` query arg (Gravatar + the WP.com proxy both honour it).
 *
 * @param avatarUrl - The `avatar` URL handed back by the subscribers API.
 * @param size      - Pixel size to request from Gravatar.
 * @return Final `<img src>`.
 */
function buildAvatarSrc( avatarUrl: string | undefined, size: number ): string {
	const url = avatarUrl && avatarUrl.length > 0 ? avatarUrl : FALLBACK_HOST;
	return addQueryArgs( url, { s: size, d: 'mm' } );
}

/**
 * Minimal avatar component used by the Subscribers stage. Renders the URL
 * the API already provides on each subscriber row (`avatar` field) — we
 * don't need the hovercard / hash-from-email features that the shared
 * design-system Gravatar covers, and avoiding that import keeps the
 * wp-build bundle from pulling `@gravatar-com/hovercards` into esbuild.
 *
 * @param props             - Component props.
 * @param props.avatarUrl   - URL from the subscribers API row.
 * @param props.email       - Email address; used as `alt` fallback.
 * @param props.displayName - Display name; preferred `alt` text.
 * @param props.size        - Pixel size (defaults to 32).
 * @param props.className   - Optional class name passed through to the `<img>`.
 * @return Avatar `<img>`.
 */
export default function Avatar( {
	avatarUrl,
	email,
	displayName,
	size = 32,
	className,
}: Props ): JSX.Element {
	const src = buildAvatarSrc( avatarUrl, size );
	const alt = displayName || email || '';
	return (
		<img
			src={ src }
			alt={ alt }
			width={ size }
			height={ size }
			className={ className }
			loading="lazy"
		/>
	);
}
