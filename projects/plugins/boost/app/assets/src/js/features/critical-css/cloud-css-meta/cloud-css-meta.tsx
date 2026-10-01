import { __ } from '@wordpress/i18n';
import { useModuleSurface } from '$features/module/surface';
import { Text } from '@wordpress/ui';
import Status from '../status/status';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
import { isFatalError } from '../lib/critical-css-errors';
import styles from './cloud-css-meta.module.scss';

export default function CloudCssMetaProps() {
	const isModern = useModuleSurface() === 'row';
	const [ cssState ] = useCriticalCssState();
	const showFatalError = isFatalError( cssState );

	if ( isModern && ! showFatalError ) {
		return (
			<Text variant="body-sm" render={ <p /> } className={ styles.well }>
				{ __(
					'Boost will automatically generate your Critical CSS whenever you make changes.',
					'jetpack-boost'
				) }
			</Text>
		);
	}

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
			showFatalError={ showFatalError }
			extraText={ extraText || undefined }
			overrideText={ overrideText || undefined }
		/>
	);
}
