import { __ } from '@wordpress/i18n';
import Header from '$layout/header/header';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import Footer from '$layout/footer/footer';
import styles from './cache-debug-log.module.scss';
import classNames from 'classnames';
import { CopyToClipboard } from '@automattic/jetpack-components';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDataSync( 'jetpack_boost_ds', 'cache_debug_log', z.string(), {
		query: {
			// Keep refreshing the logs every 10 seconds
			refetchInterval: 10000,
		},
	} );

	return (
		<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
			<Header subPageTitle={ __( 'Cache Log Viewer', 'jetpack-boost' ) } />
			<div className={ classNames( 'jb-section jb-section--main', styles.section ) }>
				<div className="jb-container">
					<header className={ styles.header }>
						<h3>{ __( 'Jetpack Boost Cache Log Viewer', 'jetpack-boost' ) }</h3>
						<CopyToClipboard
							buttonStyle="icon-text"
							className={ styles[ 'copy-button' ] }
							textToCopy={ debugLog as string }
							variant="link"
							weight="regular"
						>
							{ __( 'Copy to clipboard', 'jetpack-boost' ) }
						</CopyToClipboard>
					</header>

					<pre className={ styles[ 'log-text' ] }>{ debugLog }</pre>
				</div>
			</div>
			<Footer />
		</div>
	);
};

export default CacheDebugLog;
