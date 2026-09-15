import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import BoostAdminPage from '$layout/boost-admin-page/boost-admin-page';
import CopyLogButton from '$features/page-cache/copy-log-button/copy-log-button';
import { useDebugLog } from '$features/page-cache/lib/stores';
import SubpageBreadcrumbs from '$features/ui/subpage-breadcrumbs/subpage-breadcrumbs';
import styles from './cache-debug-log.module.scss';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();

	return (
		<BoostAdminPage
			breadcrumbs={ <SubpageBreadcrumbs current={ __( 'Cache debug log', 'jetpack-boost' ) } /> }
		>
			<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
				<div className={ clsx( 'jb-section jb-section--main', styles.section ) }>
					<div className="jb-container">
						<div id="jp-admin-notices" className="jetpack-boost-jitm-card" />
						<header className={ styles.header }>
							<h3>{ __( 'Jetpack Boost Cache Log Viewer', 'jetpack-boost' ) }</h3>
							<CopyLogButton text={ debugLog || '' } className={ styles[ 'copy-button' ] } />
						</header>

						<pre className={ styles[ 'log-text' ] }>{ debugLog }</pre>
					</div>
				</div>
			</div>
		</BoostAdminPage>
	);
};

export default CacheDebugLog;
