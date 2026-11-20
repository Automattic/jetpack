import { useModuleSurface } from '$features/module/surface';
import TimeAgo from '$features/critical-css/time-ago/time-ago';
import { __ } from '@wordpress/i18n';
import { Progress } from '@wordpress/ui';
import { useLcpState } from '../lib/stores/lcp-state';
import styles from './status.module.scss';
import type { FC } from 'react';

const Status: FC = () => {
	const legacyProgress = __(
		"Jetpack Boost is optimizing your Cornerstone Page's LCP for you.",
		'jetpack-boost'
	);
	const modernProgress = __(
		"Jetpack Boost is optimizing your Cornerstone Page's LCP…",
		'jetpack-boost'
	);
	const isModern = useModuleSurface() === 'row';
	const [ query ] = useLcpState();
	const lcpState = query?.data;

	if ( lcpState?.status === 'error' ) {
		return (
			<div className={ styles?.failures }>
				{ __(
					"An error occurred while optimizing your Cornerstone Page's LCP. Please try again.",
					'jetpack-boost'
				) }
			</div>
		);
	}

	if ( lcpState?.status === 'not_analyzed' ) {
		// This should never happen, but just in case.
		return (
			<div>
				{ __(
					"Click the optimize button to start optimizing your Cornerstone Page's LCP.",
					'jetpack-boost'
				) }
			</div>
		);
	}

	if ( lcpState?.status === 'pending' ) {
		if ( isModern ) {
			return (
				<div className={ styles.pending }>
					<span>{ modernProgress }</span>
					<Progress.Root
						className={ styles.progress }
						aria-label={ __( 'Optimizing LCP images', 'jetpack-boost' ) }
						value={ null }
					>
						<Progress.Track className={ styles.track }>
							<Progress.Indicator className={ styles.indicator } />
						</Progress.Track>
					</Progress.Root>
				</div>
			);
		}

		return <div className={ styles?.generating }>{ legacyProgress }</div>;
	}

	if ( lcpState?.status !== 'analyzed' || ! lcpState?.updated ) {
		return null;
	}

	return (
		<>
			<div className={ styles?.successes }>
				{ __( 'Last optimized', 'jetpack-boost' ) }{ ' ' }
				<TimeAgo time={ new Date( lcpState.updated * 1000 ) } />.
			</div>
		</>
	);
};

export default Status;
