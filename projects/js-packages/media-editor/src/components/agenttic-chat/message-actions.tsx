/**
 * Message Actions for Agenttic Chat
 *
 * Custom message actions for the media editor chat,
 * including copy, apply changes, and feedback actions.
 */

import { createFeedbackActions } from '@automattic/agenttic-client';

// Type definitions for message actions
interface MessageActionsRegistration {
	id: string;
	actions: Array< {
		id: string;
		label: string;
		icon?: string;
		tooltip?: string;
		onClick: ( message: any ) => void | Promise< void >;
	} >;
}

// Extend window type for gtag
declare global {
	interface Window {
		gtag?: ( ...args: any[] ) => void;
	}
}

/**
 * Create feedback actions for media editor chat
 */
export const createMediaEditorFeedbackActions = () => {
	return createFeedbackActions( {
		onFeedback: async ( messageId: string, feedback: 'up' | 'down' ) => {
			// TODO: Send feedback to analytics or logging system
			console.log( `Feedback ${ feedback } for message ${ messageId }` );

			// TODO: Could integrate with WordPress analytics or custom tracking
			if ( typeof window !== 'undefined' && window.gtag ) {
				window.gtag( 'event', 'agent_feedback', {
					message_id: messageId,
					feedback_type: feedback,
					context: 'media_editor',
				} );
			}
		},
		icons: {
			up: '👍',
			down: '👎',
		},
	} );
};

/**
 * Create custom message actions for media editor
 */
export const createMediaEditorMessageActions = (): MessageActionsRegistration => {
	return {
		id: 'media-editor-actions',
		actions: [
			{
				id: 'copy',
				label: 'Copy',
				icon: '📋',
				tooltip: 'Copy message to clipboard',
				onClick: async message => {
					const textContent = message.content
						.filter( ( c: any ) => c.type === 'text' )
						.map( ( c: any ) => c.text )
						.join( '' );

					try {
						await navigator.clipboard.writeText( textContent );
						// TODO: Show success toast
						console.log( 'Message copied to clipboard' );
					} catch ( error ) {
						console.error( 'Failed to copy to clipboard:', error );
						// TODO: Show error toast
					}
				},
			},
			{
				id: 'apply-changes',
				label: 'Apply',
				icon: '✅',
				tooltip: 'Apply suggested changes to image',
				onClick: async message => {
					// TODO: Parse message for actionable changes and apply them
					console.log( 'Apply changes clicked for message:', message );

					// This could parse the message content for tool suggestions
					// and automatically execute them, or open a preview dialog

					// Example: Look for tool suggestions in the message
					const textContent = message.content
						.filter( ( c: any ) => c.type === 'text' )
						.map( ( c: any ) => c.text )
						.join( '' );

					// TODO: Implement logic to extract and apply suggested changes
					if ( textContent.includes( 'crop' ) ) {
						console.log( 'Message suggests cropping changes' );
						// Could trigger crop tool with suggested parameters
					}

					if ( textContent.includes( 'resize' ) ) {
						console.log( 'Message suggests resizing changes' );
						// Could trigger resize tool with suggested parameters
					}
				},
			},
			{
				id: 'preview-changes',
				label: 'Preview',
				icon: '👁️',
				tooltip: 'Preview suggested changes',
				onClick: async message => {
					// TODO: Create a preview of suggested changes without applying them
					console.log( 'Preview changes clicked for message:', message );

					// This could show a modal with before/after comparison
					// or highlight the areas that would be affected
				},
			},
			{
				id: 'save-conversation',
				label: 'Save',
				icon: '💾',
				tooltip: 'Save this conversation',
				onClick: async message => {
					// TODO: Save the conversation or specific message
					console.log( 'Save conversation clicked for message:', message );

					// This could save the conversation to user meta,
					// or export as a text file

					try {
						const conversationData = {
							messageId: message.id,
							timestamp: new Date().toISOString(),
							content: message.content,
							mediaId: message.mediaId, // TODO: Add media context
						};

						// TODO: Save to WordPress database or local storage
						localStorage.setItem(
							`agenttic-conversation-${ message.id }`,
							JSON.stringify( conversationData )
						);

						console.log( 'Conversation saved' );
					} catch ( error ) {
						console.error( 'Failed to save conversation:', error );
					}
				},
			},
		],
	};
};

/**
 * All available message actions for media editor
 */
export const getAllMediaEditorMessageActions = () => {
	return [ createMediaEditorFeedbackActions(), createMediaEditorMessageActions() ];
};

/**
 * Default export
 */
export default createMediaEditorMessageActions;
