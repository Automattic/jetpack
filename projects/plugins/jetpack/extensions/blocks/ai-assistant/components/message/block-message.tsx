/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import Message, { MESSAGE_SEVERITY_INFO, MESSAGE_SEVERITY_SUCCESS } from '.';
import './style.scss';
/**
 * Types
 */
import type { MessageSeverityProp, MessageProps } from '.';
import type React from 'react';

export const ASSISTANT_STATE_INIT = 'init';
export const ASSISTANT_STATE_READY_TO_GENERATE = 'ready-to-generate';
export const ASSISTANT_STATE_GENERATING = 'generating-content';
export const ASSISTANT_STATE_CONTENT_GENERATED = 'content-generated';

const blockStateTypes = [
	ASSISTANT_STATE_INIT,
	ASSISTANT_STATE_READY_TO_GENERATE,
	ASSISTANT_STATE_GENERATING,
	ASSISTANT_STATE_CONTENT_GENERATED,
] as const;

export type BlockMessageProps = MessageProps & {
	state: ( typeof blockStateTypes )[ number ];
	onAccept: () => void;
	onStop: () => void;
};

/**
 * React component to render a block message.
 *
 * @param {BlockMessageProps} props - Component props.
 * @returns {React.ReactElement }    Banner component.
 */
export default function BlockMessage( props: BlockMessageProps ): React.ReactElement {
	const { state, onAccept, onStop } = props;
	if ( ! state ) {
		return null;
	}

	// Ready to generate message
	let messageText = null;
	let severity: MessageSeverityProp = MESSAGE_SEVERITY_INFO;

	switch ( state ) {
		case ASSISTANT_STATE_INIT:
			messageText = __( 'Ask AI Assistant for anything…', 'jetpack' ); // 'Ask for content suggestions.
			break;

		case ASSISTANT_STATE_READY_TO_GENERATE:
			messageText = createInterpolateElement(
				__( 'Press <em>Enter</em> to send your request.', 'jetpack' ),
				{
					em: <em />,
				}
			);

			break;

		case ASSISTANT_STATE_GENERATING:
			messageText = createInterpolateElement(
				__( 'Generating content… Click on the <button>Stop</button> button to cancel', 'jetpack' ),
				{
					button: <Button variant="link" onClick={ onStop } />,
				}
			);
			break;

		case ASSISTANT_STATE_CONTENT_GENERATED:
			messageText = createInterpolateElement(
				__( "Done! Don't forget to <button>Accept</button> the content", 'jetpack' ),
				{
					button: <Button variant="link" onClick={ onAccept } />,
				}
			);

			severity = MESSAGE_SEVERITY_SUCCESS;
			break;
	}

	return (
		<Message { ...props } severity={ severity }>
			{ messageText }
		</Message>
	);
}
