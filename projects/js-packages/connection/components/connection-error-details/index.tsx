import { Link, Stack, Text } from '@wordpress/ui';
import { useCallback } from 'react';
import { formatConnectionErrorDetailLine } from '../../hooks/use-connection-error-notice/error-details';
import ConnectionErrorSupportLink from '../connection-error-support-link';
import type { ConnectionErrorDetailsProps } from './types';
import type { ConnectionErrorNoticeLink } from '../../hooks/use-connection-error-notice/types';
import type { ReactNode } from 'react';

/**
 * One notice-body link (e.g. "Visit Site Health"), with its click handler bound
 * to the link so the list can pass a stable reference rather than a per-item
 * arrow (`react/jsx-no-bind`).
 *
 * @param {object}                    props         - Component props.
 * @param {ConnectionErrorNoticeLink} props.link    - The link to render.
 * @param {Function}                  props.onClick - Optional click handler.
 * @return {ReactNode} The rendered link.
 */
function NoticeLink( {
	link,
	onClick,
}: {
	link: ConnectionErrorNoticeLink;
	onClick?: ( link: ConnectionErrorNoticeLink ) => void;
} ): ReactNode {
	const handleClick = useCallback( () => onClick?.( link ), [ link, onClick ] );

	return (
		<Text>
			<Link href={ link.url } onClick={ handleClick }>
				{ link.label }
			</Link>
		</Text>
	);
}

/**
 * What a connection error says, without the chrome that carries it.
 *
 * Shared by the package's own notice and by status surfaces that are not
 * notices (My Jetpack's connection card), so the two describe one error with
 * one set of words.
 *
 * @param {ConnectionErrorDetailsProps} props - The errors to describe.
 * @return {ReactNode} The description, or null when there is nothing to describe.
 */
function ConnectionErrorDetails( {
	message,
	errorGroups = [],
	showSupportLink = false,
	variant,
	onNoticeLinkClick,
	onSupportLinkClick,
}: ConnectionErrorDetailsProps ): ReactNode {
	if ( ! message && ! errorGroups.length ) {
		return null;
	}

	const supportLink = showSupportLink ? (
		<Text variant={ variant }>
			<ConnectionErrorSupportLink onClick={ onSupportLinkClick } />
		</Text>
	) : null;

	// Every displayable error, each headline followed by the scopes it applies to
	// and any link that error asks for (e.g. Site Health) — kept directly beneath
	// its own group rather than pooled at the end, where it would float free of
	// the message it belongs to once more than one group is showing. `gap="md"`
	// between groups (vs. `gap="xs"` within one) makes each error visually
	// distinct; a plain `message` is the fallback for callers with their own copy.
	if ( ! errorGroups.length ) {
		return (
			<Stack direction="column" gap="md">
				{ message }
				{ supportLink }
			</Stack>
		);
	}

	return (
		<Stack direction="column" gap="md">
			{ errorGroups.map( group => (
				<Stack key={ group.message } direction="column" gap="xs">
					<Text variant={ variant }>{ group.message }</Text>
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
									{ formatConnectionErrorDetailLine( line ) }
								</Text>
							) ) }
						</Stack>
					) }
					{ group.noticeLinks.map( link => (
						<NoticeLink key={ link.url } link={ link } onClick={ onNoticeLinkClick } />
					) ) }
				</Stack>
			) ) }
			{ supportLink }
		</Stack>
	);
}

export default ConnectionErrorDetails;
