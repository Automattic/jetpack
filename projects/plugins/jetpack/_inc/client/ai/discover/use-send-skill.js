/**
 * Hand a skill to an agent: the WordPress Agent, Claude, ChatGPT, or the
 * clipboard. Shared by every place a skill can be sent from (Discover's cards
 * and side panel, the Overview's hero), so each builds the same prompt, shows
 * the same snackbars and records the same Tracks event, told apart only by
 * `location`.
 */

import { useDispatch } from '@wordpress/data';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import { EVENTS, recordAiHubEvent } from '../tracks';
import { EXTERNAL_AGENTS } from './send-to-agent';
import { buildPrompt } from './skills';
import { askWordPressAgent } from './wordpress-agent';

// One id for every hand-off, so a new one replaces the last one's snackbar.
const NOTICE_ID = 'jetpack-ai-discover-handoff';

/**
 * Copy text to the clipboard. Resolves false when the browser refuses, for
 * example outside a secure context, so callers can say so.
 *
 * @param {string} text - The text to copy.
 * @return {Promise<boolean>} Whether the text was copied.
 */
export function copyText( text ) {
	if ( ! window.navigator?.clipboard?.writeText ) {
		return Promise.resolve( false );
	}
	return window.navigator.clipboard.writeText( text ).then(
		() => true,
		() => false
	);
}

/**
 * The site's address for prompts and copy, from the admin URL the page
 * already carries: "example.com", or "example.com/blog" for a subdirectory.
 *
 * @return {string} The site's address.
 */
export function getSiteName() {
	const { siteAdminUrl } = window?.jetpackAiSettings ?? {};
	try {
		const url = new URL( siteAdminUrl );
		return ( url.host + url.pathname.replace( /\/wp-admin\/?$/, '' ) ).replace( /\/$/, '' );
	} catch {
		return window.location.host;
	}
}

/**
 * Send skills to agents from one place on the page.
 *
 * `send` and `copyPrompt` take an optional last argument that overrides
 * `location` for one call, for a surface with more than one control, such as
 * the side panel's Send to agent and its prompt's Copy.
 *
 * @param {object} options          - Options.
 * @param {string} options.location - Where the sends come from, for Tracks, e.g. 'card',
 *                                  'panel' or 'overview_hero'.
 * @return {{send: Function, copyPrompt: Function, siteName: string}} `send( skill, agent )`
 * hands the skill over, with agent 'wordpress' | 'claude' | 'chatgpt' | 'copy';
 * `copyPrompt( skill )` copies its prompt; both resolve to whether the hand-off
 * happened. `siteName` is the address the prompts name.
 */
export default function useSendSkill( { location } ) {
	const siteName = useMemo( getSiteName, [] );
	const { createSuccessNotice, createErrorNotice } = useDispatch( noticesStore );

	const notify = useCallback(
		message => createSuccessNotice( message, { type: 'snackbar', id: NOTICE_ID } ),
		[ createSuccessNotice ]
	);

	const send = useCallback(
		( skill, agent, where = location ) => {
			const prompt = buildPrompt( skill, siteName );
			const record = outcome =>
				recordAiHubEvent( EVENTS.DISCOVER_SKILL_SENT, {
					skill: skill.slug,
					agent,
					location: where,
					outcome,
				} );

			// The WordPress Agent can go away after the menu rendered (the Agents
			// Manager unloaded, or missing its input), so the outcome is what
			// the ask reports, and a failed one says so.
			if ( agent === 'wordpress' ) {
				const opened = askWordPressAgent( prompt );
				record( opened ? 'sent' : 'unavailable' );
				if ( ! opened ) {
					createErrorNotice( __( 'Couldn’t open the WordPress Agent.', 'jetpack' ), {
						type: 'snackbar',
						id: NOTICE_ID,
					} );
				}
				return Promise.resolve( opened );
			}

			// Copying is the whole hand-off here, so the outcome waits for the
			// browser's answer: a refused copy sent nothing.
			if ( agent === 'copy' ) {
				return copyText( prompt ).then( copied => {
					record( copied ? 'sent' : 'copy_failed' );
					if ( copied ) {
						notify( __( 'Prompt copied', 'jetpack' ) );
					} else {
						createErrorNotice(
							// No second sentence on where to copy it from: this runs from
							// cards, the panel and the Overview alike.
							__( 'Couldn’t copy the prompt.', 'jetpack' ),
							{ type: 'snackbar', id: NOTICE_ID }
						);
					}
					return copied;
				} );
			}

			const { name, url } = EXTERNAL_AGENTS[ agent ];
			record( 'sent' );
			// Start the copy while this tab still has focus, then open the agent
			// inside the click so the browser allows the new tab. The URL carries
			// the prompt too, so the copy is only a fallback.
			const copying = copyText( prompt );
			window.open( url( prompt ), '_blank', 'noopener,noreferrer' );
			return copying.then( copied => {
				notify(
					copied
						? sprintf(
								/* translators: %s: an AI agent's name, e.g. "Claude". */
								__( 'Prompt copied. Opening %s…', 'jetpack' ),
								name
							)
						: sprintf(
								/* translators: %s: an AI agent's name, e.g. "Claude". */
								__( 'Opening %s…', 'jetpack' ),
								name
							)
				);
				return true;
			} );
		},
		[ location, siteName, notify, createErrorNotice ]
	);

	const copyPrompt = useCallback(
		( skill, where = location ) => send( skill, 'copy', where ),
		[ send, location ]
	);

	return useMemo( () => ( { send, copyPrompt, siteName } ), [ send, copyPrompt, siteName ] );
}
