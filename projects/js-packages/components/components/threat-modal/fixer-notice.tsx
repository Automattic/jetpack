import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';
import ThreatNotice from './threat-notice';

/**
 * FixerNotice component
 *
 * @param {object}  props                       - The component props.
 * @param {object}  props.fixerState            - The state of the fixer (inProgress, error, stale).
 * @param {boolean} props.fixerState.inProgress - Whether the fixer is in progress.
 * @param {boolean} props.fixerState.error      - Whether the fixer encountered an error.
 * @param {boolean} props.fixerState.stale      - Whether the fixer is stale.
 *
 * @return {JSX.Element | null} The rendered fixer notice or null if no notice is available.
 */
const FixerNotice = ( {
	fixerState,
}: {
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
} ) => {
	let status: 'error' | 'success' | undefined;
	let title: string | undefined;
	let content: string | undefined;

	if ( fixerState.error ) {
		status = 'error';
		title = __( 'An error occurred auto-fixing this threat', 'jetpack' );
		content = __(
			'Jetpack encountered a filesystem error when attempting to auto-fix this threat. Please try again later or contact support.',
			'jetpack'
		);
	} else if ( fixerState.stale ) {
		status = 'error';
		title = __( 'The auto-fixer is taking longer than expected', 'jetpack' );
		content = __(
			'Jetpack has been attempting to auto-fix this threat for too long, and something may have gone wrong. Please try again later or contact support.',
			'jetpack'
		);
	} else if ( fixerState.inProgress ) {
		status = 'success';
		title = __( 'An auto-fixer is in progress', 'jetpack' );
		content = __( 'Please wait while Jetpack auto-fixes the threat.', 'jetpack' );
	}

	return title ? (
		<div className={ styles[ 'fixer-notice' ] }>
			<ThreatNotice status={ status } title={ title } content={ content } />
		</div>
	) : null;
};

export default FixerNotice;
