import TimeAgo from '$features/critical-css/time-ago/time-ago';
import { __ } from '@wordpress/i18n';
import { useLcpState } from '../lib/stores/lcp-state';
import styles from './status.module.scss';

const Status: React.FC = () => {
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
		return (
			<div className={ styles?.generating }>
				{ __(
					"Jetpack Boost is optimizing your Cornerstone Page's LCP for you.",
					'jetpack-boost'
				) }
			</div>
		);
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
