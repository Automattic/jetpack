import { sprintf, __ } from '@wordpress/i18n';
import { ErrorSet } from '../lib/critical-css-errors';
import { rawError } from '../lib/describe-critical-css-recommendations';

export default function RawError( { errorSet }: { errorSet: ErrorSet } ) {
	const rawErrorMessage = rawError( errorSet );

	return (
		<p>
			{ sprintf(
				// translators: %s is the error message
				__( 'Error: %s', 'jetpack-boost' ),
				rawErrorMessage
			) }
		</p>
	);
}
