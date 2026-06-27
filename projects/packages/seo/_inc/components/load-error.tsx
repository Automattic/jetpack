import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import type { FC } from 'react';

interface Props {
	/** The tab-specific error message to show (already translated). */
	message: string;
}

// Reload the page — recovers the bootstrap read (see the component docblock).
const reload = () => window.location.reload();

/**
 * A recoverable load-error notice for the dashboard screens.
 *
 * Each screen reads its state synchronously from the page bootstrap
 * (`window.JetpackScriptData.seo`, via `getScriptData`) on first render. That
 * read is one-shot and non-reactive: if the data isn't readable at that single
 * instant — e.g. a stale or mismatched script bundle after a plugin update, or
 * a transient gap in the server-side injection — the screen would otherwise
 * dead-end on a terminal error, even though the data is typically present a
 * moment later. Pairing the message with a Reload action keeps a momentary,
 * self-recoverable hiccup from stranding the user: a reload re-runs both the
 * server-side injection and the asset fetch, which clears either cause.
 *
 * @param props         - Component props.
 * @param props.message - The tab-specific error message (already translated).
 * @return The recoverable error notice.
 */
const LoadError: FC< Props > = ( { message } ) => (
	<Notice.Root intent="error">
		<Notice.Description>{ message }</Notice.Description>
		<Notice.Actions>
			<Notice.ActionButton onClick={ reload }>
				{ __( 'Reload', 'jetpack-seo' ) }
			</Notice.ActionButton>
		</Notice.Actions>
	</Notice.Root>
);

export default LoadError;
