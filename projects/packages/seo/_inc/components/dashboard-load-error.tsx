import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import styles from './dashboard-load-error.module.scss';
import type { FC } from 'react';

interface Props {
	/** Re-attempt the fetch in place (no full page reload). */
	onRetry: () => void;
}

/**
 * Shown when a dashboard tab's data genuinely fails to load, after the silent
 * retries in [use-ensure-tab-data] are exhausted. A calm, recoverable state
 * rather than a raw error: "Try again" re-fetches in place — no full page reload.
 *
 * @param props         - Component props.
 * @param props.onRetry - Re-attempt the fetch.
 * @return The load-error state.
 */
const DashboardLoadError: FC< Props > = ( { onRetry } ) => (
	<div className={ styles.root }>
		<h2 className={ styles.title }>{ __( 'We couldn’t load this page', 'jetpack-seo' ) }</h2>
		<p className={ styles.body }>
			{ __( 'This is usually temporary. Give it another try.', 'jetpack-seo' ) }
		</p>
		<Button onClick={ onRetry }>{ __( 'Try again', 'jetpack-seo' ) }</Button>
	</div>
);

export default DashboardLoadError;
