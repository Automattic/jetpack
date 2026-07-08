/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './widget-loading-overlay.module.scss';

/**
 * Local stand-in for `WidgetLoadingOverlay` from `@automattic/dashboard`
 * (CIAB Admin), which is not published to npm. Renders a centered spinner
 * that overlays the widget content while data is loading or refetching.
 *
 * TODO: Replace with the `@automattic/dashboard` component once it is
 * available in the monorepo or published to npm.
 */
export function WidgetLoadingOverlay() {
	return (
		<Stack justify="center" align="center" className={ styles.overlay }>
			<Spinner />
		</Stack>
	);
}
