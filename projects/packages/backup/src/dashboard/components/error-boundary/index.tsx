import { Button, Card } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import './style.scss';
import type { ErrorInfo, ReactNode } from 'react';

type Props = {
	children: ReactNode;
};

type State = {
	error: Error | null;
};

/**
 * Reload the current page.
 *
 * Hoisted out of the render so the button's handler is a stable
 * reference rather than a new closure on every render.
 */
function reloadPage() {
	window.location.reload();
}

/**
 * Route-level error boundary for the modernized Backup dashboard.
 *
 * Without one, a throw anywhere on the render path unmounts the whole
 * React tree and leaves an empty `<div>` inside the page chrome — a
 * blank panel with no explanation and nothing to click.
 *
 * This is defence in depth rather than a fix for one known hole. The
 * hazard it was written for — `toFileNode` calling `toISOString()` on a
 * `period` parsed straight out of an unvalidated WPCOM manifest — is
 * guarded at the source, and that guard is the right place for it,
 * because dropping one timestamp beats blanking the file browser. What
 * the boundary buys is that the next such field, in the next component,
 * costs a legible error screen instead of a white rectangle.
 *
 * A class component because that is still the only way to implement
 * `getDerivedStateFromError` — React exposes no hook equivalent.
 *
 * Recovery is a reload rather than a state reset: by the time this
 * renders, the failed subtree's state is gone, so offering "try again"
 * without remounting would re-throw immediately.
 */
export default class ErrorBoundary extends Component< Props, State > {
	state: State = { error: null };

	/**
	 * Record the error so the next render shows the fallback.
	 *
	 * @param error - The thrown error.
	 * @return The next state.
	 */
	static getDerivedStateFromError( error: Error ): State {
		return { error };
	}

	/**
	 * Log the component stack, which the fallback deliberately does not
	 * show — it is the only part of the report that identifies where the
	 * throw came from, and support needs it more than the reader does.
	 *
	 * @param error     - The thrown error.
	 * @param errorInfo - React's component stack.
	 */
	componentDidCatch( error: Error, errorInfo: ErrorInfo ) {
		// eslint-disable-next-line no-console
		console.error( '[Jetpack Backup] Unhandled error:', error, errorInfo.componentStack );
	}

	/**
	 * Render the children, or the fallback once an error has been caught.
	 *
	 * @return The rendered tree.
	 */
	render() {
		const { error } = this.state;
		if ( ! error ) {
			return this.props.children;
		}

		return (
			<Card className="jpb-error-boundary">
				<Stack direction="column" gap="md" align="center">
					{ /*
					 * An `h1`, not an `h2`: the page's own `h1` comes from
					 * `<Page title>` inside `<DashboardLayout>`, and this
					 * fallback renders *instead of* that whole subtree. When
					 * it is on screen there is no other heading on the page,
					 * so this is the document's first one. (Every other first
					 * in-body heading is an `h2`, because they all render
					 * inside the layout with that `h1` still above them.)
					 */ }
					<Text variant="heading-md" render={ <h1 /> }>
						{ __( 'Something went wrong', 'jetpack-backup-pkg' ) }
					</Text>
					<Text>
						{ __(
							'The page ran into an unexpected problem. Your backups are unaffected.',
							'jetpack-backup-pkg'
						) }
					</Text>
					<Text variant="body-sm" className="jpb-text-muted">
						{ error.message }
					</Text>
					<Button variant="primary" onClick={ reloadPage }>
						{ __( 'Reload the page', 'jetpack-backup-pkg' ) }
					</Button>
				</Stack>
			</Card>
		);
	}
}
