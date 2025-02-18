import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
import styles from './styles.module.scss';
import ThreatNotice from './threat-notice.js';

/**
 * FixerStateNotice component
 *
 * @param {object}  props                       - The component props.
 * @param {object}  props.fixerState            - The state of the fixer (inProgress, error, stale).
 * @param {boolean} props.fixerState.inProgress - Whether the fixer is in progress.
 * @param {boolean} props.fixerState.error      - Whether the fixer encountered an error.
 * @param {boolean} props.fixerState.stale      - Whether the fixer is stale.
 *
 * @return {JSX.Element | null} The rendered fixer notice or null if no notice is available.
 */
const FixerStateNotice = ( {
	fixerState,
}: {
	fixerState: { inProgress: boolean; error: boolean; stale: boolean };
} ) => {
	const { status, title, content } = useMemo( () => {
		if ( fixerState.error ) {
			return {
				status: 'error' as const,
				title: __( 'An error occurred auto-fixing this threat', 'jetpack-components' ),
				content: __(
					'Jetpack encountered a filesystem error while attempting to auto-fix this threat. Please try again later or contact support.',
					'jetpack-components'
				),
			};
		}

		if ( fixerState.stale ) {
			return {
				status: 'error' as const,
				title: __( 'The auto-fixer is taking longer than expected', 'jetpack-components' ),
				content: __(
					'Jetpack has been attempting to auto-fix this threat for too long, and something may have gone wrong. Please try again later or contact support.',
					'jetpack-components'
				),
			};
		}

		if ( fixerState.inProgress ) {
			return {
				status: 'success' as const,
				title: __( 'An auto-fixer is in progress', 'jetpack-components' ),
				content: __( 'Please wait while Jetpack auto-fixes the threat.', 'jetpack-components' ),
			};
		}

		return {};
	}, [ fixerState ] );

	return title ? (
		<div className={ styles[ 'fixer-notice' ] }>
			<ThreatNotice status={ status } title={ title } content={ content } />
		</div>
	) : null;
};

export default FixerStateNotice;
