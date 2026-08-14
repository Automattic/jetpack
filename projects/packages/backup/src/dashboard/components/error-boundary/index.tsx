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
 * blank panel with no explanation and nothing to click. The tree has at
 * least one known way to get there: `toFileNode` parses a `period`
 * straight out of a WPCOM manifest, and a non-numeric value makes
 * `new Date( NaN ).toISOString()` raise `RangeError: Invalid time
 * value` inside a `useMemo`. That hazard is called out in
 * `use-file-tree.ts` precisely because nothing was catching it.
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
					<Text variant="heading-md" render={ <h2 /> }>
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
