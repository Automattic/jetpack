import { __ } from '@wordpress/i18n';
import Status from '../status/status';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
import { useRetryRegenerate } from '../lib/use-retry-regenerate';

export default function CloudCssMetaProps() {
	const [ cssState ] = useCriticalCssState();
	const [ hasRetried, retry ] = useRetryRegenerate();

	return (
		<Status
			cssState={ cssState }
			isCloud={ true }
			hasRetried={ hasRetried }
			retry={ retry }
			showRegenerateButton={ false }
			generateText={ __(
				'Jetpack Boost will generate Critical CSS for you automatically.',
				'jetpack-boost'
			) }
			generateMoreText={ __( 'Jetpack Boost is generating more Critical CSS.', 'jetpack-boost' ) }
		/>
	);
}
