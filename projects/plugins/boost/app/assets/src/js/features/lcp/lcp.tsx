import Module from '$features/module/module';
import { useModuleSurface } from '$features/module/surface';
import { recordBoostEvent } from '$lib/utils/analytics';
import RefreshIcon from '$svg/refresh';
import { Button } from '@automattic/jetpack-components';
import { queryClient } from '@automattic/jetpack-react-data-sync-client';
import { __ } from '@wordpress/i18n';
import { useLcpState, useOptimizeLcpAction } from './lib/stores/lcp-state';
import { LcpState } from './lib/stores/lcp-state-types';
import { ErrorDetails } from './status/error-details';
import Status from './status/status';
import styles from './status/status.module.scss';

const Lcp = () => {
	const legacyDescription = __(
		'Improve the Largest Contentful Paint (LCP) of your Cornerstone Pages, optimizing their key image, so users can enjoy a smoother experience.',
		'jetpack-boost'
	);
	const modernDescription = __(
		'Optimizes the main visible image used to calculate your Cornerstone Pages’ LCP scores.',
		'jetpack-boost'
	);
	const surface = useModuleSurface();
	const [ query ] = useLcpState();
	const lcpState = query?.data;

	const optimizeAction = useOptimizeLcpAction();

	const handleEnable = () => {
		// Refetch the lcp State as when the module is enabled, the Analyzer will start running.
		query.refetch();
	};

	const handleBeforeToggle = ( newStatus: boolean ) => {
		if ( newStatus ) {
			// Ensure that the state is optimistically set to pending when the module is enabled.
			queryClient.setQueryData( [ 'lcp_state' ], ( lcp: LcpState ) => ( {
				...lcp,
				status: 'pending',
			} ) );
		}
	};

	const handleClickOptimize = () => {
		recordBoostEvent( 'lcp_optimize_clicked', {} );
		optimizeAction.mutate();
	};

	return (
		<Module
			slug="lcp"
			title={ __( 'Optimize LCP Images', 'jetpack-boost' ) }
			worksOffline={ false }
			description={ <p>{ surface === 'row' ? modernDescription : legacyDescription }</p> }
			onEnable={ handleEnable }
			onBeforeToggle={ handleBeforeToggle }
		>
			<div
				className={ surface === 'row' ? styles.well : styles.status }
				data-testid={ surface === 'row' ? 'lcp-status-well' : undefined }
			>
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
