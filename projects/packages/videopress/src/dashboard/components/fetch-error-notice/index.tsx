import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';

/**
 * Extract a human-readable detail from a thrown value. Covers Error instances
 * and `@wordpress/api-fetch`'s plain `{ code, message }` rejection objects; a
 * raw `Response` (rejected by `parse: false` requests) has no message and
 * yields null, so only the caller's generic sentence renders.
 *
 * @param error - Whatever the query rejected with.
 * @return The detail string, or null when there's nothing readable.
 */
function errorDetail( error: unknown ): string | null {
	if ( typeof error === 'object' && error !== null && 'message' in error ) {
		const message = ( error as { message?: unknown } ).message;
		if ( typeof message === 'string' && message.trim() ) {
			return message;
		}
	}
	return null;
}

type Props = {
	/** The generic, translated "we couldn't load X" sentence. */
	message: string;
	/** The rejection value, for an optional detail suffix. */
	error?: unknown;
	/** Invoked by the Retry action. */
	onRetry: () => void;
	className?: string;
};

/**
 * A non-dismissible error notice with a Retry action, shared by the stages'
 * failed-fetch states so they stay in lockstep. Non-dismissible on purpose:
 * it only renders when there's no data to show underneath.
 *
 * @param props           - Component props.
 * @param props.message   - The generic, translated "we couldn't load X" sentence.
 * @param props.error     - The rejection value, for an optional detail suffix.
 * @param props.onRetry   - Invoked by the Retry action.
 * @param props.className - Extra class for the notice root.
 * @return The notice element.
 */
const FetchErrorNotice = ( { message, error, onRetry, className }: Props ) => {
	const detail = errorDetail( error );
	return (
		<Notice.Root intent="error" className={ className }>
			<Notice.Description>
				{ message }
				{ detail ? ` ${ detail }` : '' }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton onClick={ onRetry }>
					{ __( 'Retry', 'jetpack-videopress-pkg' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
};

export default FetchErrorNotice;
