import { __ } from '@wordpress/i18n';
import Status from '../status/status';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
import { useRetryRegenerate } from '../lib/use-retry-regenerate';
import { isFatalError } from '../lib/critical-css-errors';

export default function CloudCssMetaProps() {
	const [ cssState ] = useCriticalCssState();
	const [ hasRetried, retry ] = useRetryRegenerate();

	const isPending = cssState.status === 'pending';
	const hasCompletedSome = cssState.providers.some( provider => provider.status !== 'pending' );
	const notGenerated = cssState.status === 'not_generated';

	// If CSS generation has made some progress but is not finished indicate that.
	const extraText =
		hasCompletedSome &&
		isPending &&
		__( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' );

	// If waiting for the back-end generator to begin, provide a blank message.
	const overrideText =
		( isPending || notGenerated ) &&
		! hasCompletedSome &&
		__( 'Jetpack Boost will generate Critical CSS for you automatically.', 'jetpack-boost' );

	return (
		<Status
			cssState={ cssState }
			isCloud={ true }
			showFatalError={ isFatalError( cssState ) }
			hasRetried={ hasRetried }
			retry={ retry }
			extraText={ extraText || undefined }
			overrideText={ overrideText || undefined }
		/>
	);
}
