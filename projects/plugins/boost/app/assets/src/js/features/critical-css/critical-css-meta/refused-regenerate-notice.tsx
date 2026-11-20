import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useEffect, useState } from 'react';
import { describeRefusedReply } from '../lib/describe-refused-reply';
import { useCriticalCssState, useRegenerateRefusal } from '../lib/stores/critical-css-state';

/**
 * Tell the user what the site answered when a Regenerate request, from any button, was refused.
 * The notice belongs to the request the dashboard held at the time, so it is removed once a run has started.
 */
export default function RefusedRegenerateNotice() {
	const refusal = useRegenerateRefusal();
	const [ cssState ] = useCriticalCssState();
	const description = useRefusedReply( refusal?.error );

	if ( ! refusal || ! description || cssState.created !== refusal.replacedCreated ) {
		return null;
	}

	return (
		<Notice.Root intent="error">
			<Notice.Title>
				{ __( 'Critical CSS generation did not start', 'jetpack-boost' ) }
			</Notice.Title>
			<Notice.Description>{ description }</Notice.Description>
		</Notice.Root>
	);
}

/**
 * Describe the reply a failed Regenerate request got, once its body has been read.
 *
 * @param error - The Regenerate request's error, if any.
 */
function useRefusedReply( error: unknown ): string | null {
	const [ refusal, setRefusal ] = useState< string | null >( null );

	useEffect( () => {
		if ( ! error ) {
			setRefusal( null );
			return;
		}

		let current = true;
		describeRefusedReply( error ).then( described => {
			if ( current ) {
				setRefusal( described ?? ( error instanceof Error ? error.message : String( error ) ) );
			}
		} );

		return () => {
			current = false;
		};
	}, [ error ] );

	return refusal;
}
