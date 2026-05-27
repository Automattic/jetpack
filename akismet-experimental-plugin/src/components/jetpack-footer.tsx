import { __ } from '@wordpress/i18n';

/**
 * Lightweight Jetpack-branded footer. Visual stand-in for `@automattic/jetpack-components`'s
 * `JetpackFooter` — that package is monorepo-internal and pulls in too many transitive
 * deps (uplot, jetpack-config, jetpack-script-data) for a standalone plugin to consume.
 *
 * Renders as `<footer role="contentinfo">`. Hidden when Jetpack isn't active (the
 * decision lives in `<App>`).
 *
 * @return JSX footer element.
 */
export function JetpackFooter(): JSX.Element {
	return (
		<footer
			className="akismet-experimental__footer"
			role="contentinfo"
			aria-label={ __( 'Jetpack credits', 'akismet' ) }
		>
			<a
				href="https://jetpack.com/redirect/?source=footer-learn-more"
				className="akismet-experimental__footer-link"
				rel="noopener noreferrer"
				target="_blank"
			>
				{ __( 'Jetpack', 'akismet' ) }
			</a>
			<span aria-hidden="true"> · </span>
			<a
				href="https://automattic.com"
				className="akismet-experimental__footer-link"
				rel="noopener noreferrer"
				target="_blank"
			>
				{ __( 'An Automattic Airline', 'akismet' ) }
			</a>
		</footer>
	);
}
