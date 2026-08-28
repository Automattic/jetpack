/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';

/**
 * The post types draft assist writes into. Mirrors DRAFT_ASSIST_POST_TYPES in
 * the Jetpack AI sidebar package: in the site editor `core/editor` serves
 * templates and template parts, where writing article prose would change the
 * site rather than a post.
 */
const DRAFT_ASSIST_POST_TYPES = [ 'post', 'page' ];

/**
 * The message the assistant receives. Matches the `/draft` editor trigger so
 * both entry points start the same conversation.
 */
const DRAFT_PROMPT = __( 'Help me draft this post', 'jetpack' );

type AgentsManagerActions = {
	isReady?: boolean;
	setChatOpen?: ( isOpen: boolean ) => void;
	submitChatMessage?: ( message?: string ) => Promise< void > | void;
};

function getAgentsManagerActions(): AgentsManagerActions | undefined {
	return ( window as unknown as { __agentsManagerActions?: AgentsManagerActions } )
		.__agentsManagerActions;
}

/**
 * Whether the host has told us draft assist is available.
 *
 * Read from the same `agentsManagerData` the sidebar bundle uses, rather than
 * re-deriving the gate, so this cannot drift from what the assistant will
 * actually accept.
 * @returns Whether the feature is on for this user.
 */
function isDraftAssistEnabled(): boolean {
	const data = ( window as unknown as {
		agentsManagerData?: { jetpackAiSidebar?: { features?: Record< string, boolean > } };
	} ).agentsManagerData;

	return data?.jetpackAiSidebar?.features?.draftAssist === true;
}

export default function DraftAssist( {
	placement,
	disabled,
}: {
	placement: string;
	disabled?: boolean;
} ) {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );

	const onClick = useCallback( () => {
		const actions = getAgentsManagerActions();

		actions?.setChatOpen?.( true );

		// `submitChatMessage` only exists once the chat panel has mounted, which
		// can be after the actions object appears. Opening the chat is what causes
		// it to mount, so give it a moment rather than dropping the prompt.
		const submit = ( attempt: number ) => {
			const submitChatMessage = getAgentsManagerActions()?.submitChatMessage;

			if ( typeof submitChatMessage === 'function' ) {
				submitChatMessage( DRAFT_PROMPT );
				return;
			}

			if ( attempt < 50 ) {
				setTimeout( () => submit( attempt + 1 ), 100 );
			}
		};

		submit( 0 );
	}, [] );

	if ( ! isDraftAssistEnabled() || ! DRAFT_ASSIST_POST_TYPES.includes( postType ) ) {
		return null;
	}

	return (
		<Button onClick={ onClick } variant="secondary" disabled={ disabled } data-placement={ placement }>
			{ __( 'Write a draft with AI', 'jetpack' ) }
		</Button>
	);
}
