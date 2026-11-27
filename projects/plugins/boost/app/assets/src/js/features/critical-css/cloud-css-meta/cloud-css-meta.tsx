import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import ShowStopperError from '../show-stopper-error/show-stopper-error';
import { useCriticalCssState } from '../lib/stores/critical-css-state';
import { isFatalError } from '../lib/critical-css-errors';
import styles from './cloud-css-meta.module.scss';

export default function CloudCssMetaProps() {
	const [ cssState ] = useCriticalCssState();
	const showFatalError = isFatalError( cssState );

	if ( ! showFatalError ) {
		return (
			<Text variant="body-sm" render={ <p /> } className={ styles.well }>
				{ __(
					'Boost will automatically generate your Critical CSS whenever you make changes.',
					'jetpack-boost'
				) }
			</Text>
		);
	}

	return (
		<ShowStopperError supportLink="https://jetpack.com/contact-support/" cssState={ cssState } />
	);
}
