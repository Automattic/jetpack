import Module from '$features/module/module';
import Pill from '$features/ui/pill/pill';
import { recordBoostEvent } from '$lib/utils/analytics';
import RefreshIcon from '$svg/refresh';
import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import styles from './status/status.module.scss';
import { useLcpState, useOptimizeLcpAction } from './lib/stores/lcp-state';
import Status from './status/status';
import { ErrorDetails } from './status/error-details';

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
			{ lcpState?.status === 'analyzed' && <ErrorDetails /> }
		</Module>
	);
};

export default Lcp;
