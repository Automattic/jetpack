import { __ } from '@wordpress/i18n';
import styles from './lcp.module.scss';
import { Button } from '@automattic/jetpack-components';
import RefreshIcon from '$svg/refresh';
import Module from '$features/module/module';
import { useLcpState, useOptimizeLcpAction } from './lib/stores/lcp-state';
import TimeAgo from '$features/critical-css/time-ago/time-ago';
import { recordBoostEvent } from '$lib/utils/analytics';
import Pill from '$features/ui/pill/pill';

const Status = () => {
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
		<div className={ styles?.successes }>
			{ __( 'Last optimized', 'jetpack-boost' ) }{ ' ' }
			<TimeAgo time={ new Date( lcpState.updated * 1000 ) } />.
		</div>
	);
};

const Lcp = () => {
	const [ query ] = useLcpState();
	const lcpState = query?.data;

	const optimizeAction = useOptimizeLcpAction();

	const handleEnable = () => {
		// Refetch the lcp State as when the module is enabled, the Analyzer will start running.
		query.refetch();
	};

	const handleClickOptimize = () => {
		recordBoostEvent( 'lcp_optimize_clicked', {} );
		optimizeAction.mutate();
	};

	return (
		<Module
			slug="lcp"
			title={
				<>
					{ __( 'Optimize LCP', 'jetpack-boost' ) }
					<Pill text={ __( 'Beta', 'jetpack-boost' ) } />
				</>
			}
			description={
				<p>
					{ __(
						'Improve the Largest Contentful Paint (LCP) of your Cornerstone pages.',
						'jetpack-boost'
					) }
				</p>
			}
			onEnable={ handleEnable }
		>
			<div className={ styles.status }>
				<div className={ styles.summary }>
					<Status />
				</div>
				<Button
					className={ styles[ 'optimize-button' ] }
					variant="link"
					size="small"
					weight="regular"
					onClick={ handleClickOptimize }
					icon={ <RefreshIcon /> }
					disabled={ lcpState?.status === 'pending' }
				>
					{ __( 'Optimize', 'jetpack-boost' ) }
				</Button>
			</div>
		</Module>
	);
};

export default Lcp;
