import { Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Link, Notice, Stack, Text } from '@wordpress/ui';
import { getReconnectErrorMessage } from '../../helpers/get-reconnect-error-message';
import ConnectionErrorSupportLink from '../connection-error-support-link';
import styles from './styles.module.scss';
import type { ConnectionErrorNoticeProps } from './types';
import type { ReactNode } from 'react';

/**
 * The presentational connection error notice.
 *
 * @param {ConnectionErrorNoticeProps} props - The errors to describe and the actions to offer.
 * @return {ReactNode} The notice, or null when there is nothing to describe.
 */
function ConnectionErrorNotice( {
	message,
	context,
	isRestoringConnection,
	restoreConnectionCallback,
	restoreConnectionError,
	actions = [],
	errorGroups = [],
	showSupportLink = false,
}: ConnectionErrorNoticeProps ): ReactNode {
	if ( ! message && ! errorGroups.length ) {
		return null;
	}

	if ( isRestoringConnection ) {
		// During reconnect, hide the intent icon so only the spinner is shown. The
		// stable `key` makes React remount the `@wordpress/ui` Notice when switching
		// states, preventing a hook order issue from component reuse.
		return (
			<Notice.Root key="reconnecting" intent="error" icon={ null }>
				<Notice.Description className={ styles.message }>
					<Spinner />
					{ __( 'Reconnecting Jetpack', 'jetpack-connection-js' ) }
				</Notice.Description>
			</Notice.Root>
		);
	}

	const errorRender = restoreConnectionError ? (
		<Notice.Root key="restore-error" intent="error" className={ styles.error }>
			<Notice.Description>
				{ getReconnectErrorMessage( restoreConnectionError ) }
			</Notice.Description>
		</Notice.Root>
	) : null;

	// Determine which actions to show.
	let actionButtons: ReactNode[] = [];

	if ( actions.length > 0 ) {
		// Use custom actions.
		actionButtons = actions.map( ( action, index ) => (
			<Notice.ActionButton
				key={ index }
				variant={ action.variant === 'primary' ? 'solid' : 'outline' }
				onClick={ action.onClick }
				loading={ action.isLoading }
				loadingAnnouncement={ action.loadingText || __( 'Loading…', 'jetpack-connection-js' ) }
			>
				{ action.label }
			</Notice.ActionButton>
		) );
	} else if ( restoreConnectionCallback ) {
		// Use default restore connection action for backward compatibility.
		actionButtons = [
			<Notice.ActionButton key="restore" variant="solid" onClick={ restoreConnectionCallback }>
				{ __( 'Restore Connection', 'jetpack-connection-js' ) }
			</Notice.ActionButton>,
		];
	}

	const supportLink = showSupportLink ? (
		<Text>
			<ConnectionErrorSupportLink />
		</Text>
	) : null;

	// Every displayable error, each headline followed by the scopes it applies to
	// and any link that error asks for (e.g. Site Health) — kept directly beneath
	// its own group rather than pooled at the end, where it would float free of
	// the message it belongs to once more than one group is showing. `gap="md"`
	// between groups (vs. `gap="xs"` within one) makes each error visually
	// distinct; a plain `message` is the fallback for callers with their own copy.
	const body = errorGroups.length ? (
		<Stack direction="column" gap="md">
			{ errorGroups.map( group => (
				<Stack key={ group.message } direction="column" gap="xs">
					<Text>{ group.message }</Text>
					{ group.detailLines.length > 0 && (
						// A real list, so assistive tech announces how many scopes an error
						// covers instead of reading loose lines. `render` keeps the layout
						// the design system's — same `gap="xs"` as the loose lines had — and
						// only swaps the elements. The `ul` is a flex container, which
						// blockifies its items and so suppresses their markers; all that is
						// left to undo is the browser's own list indent.
						<Stack
							render={ <ul /> }
							direction="column"
							gap="xs"
							style={ { margin: 0, paddingInlineStart: 0 } }
						>
							{ group.detailLines.map( line => (
								<Text render={ <li /> } key={ line.key } variant="body-sm">
									{ `- ${ line.text }` }
								</Text>
							) ) }
						</Stack>
					) }
					{ group.noticeLinks.map( link => (
						<Text key={ link.url }>
							<Link href={ link.url }>{ link.label }</Link>
						</Text>
					) ) }
				</Stack>
			) ) }
			{ supportLink }
		</Stack>
	) : (
		<Stack direction="column" gap="md">
			{ message }
			{ supportLink }
		</Stack>
	);

	return (
		<>
			{ errorRender }
			<Notice.Root key="error" intent="error">
				{ context && <Notice.Title>{ context }</Notice.Title> }
				<Notice.Description>{ body }</Notice.Description>
				{ actionButtons.length > 0 && <Notice.Actions>{ actionButtons }</Notice.Actions> }
			</Notice.Root>
		</>
	);
}

export default ConnectionErrorNotice;
