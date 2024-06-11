import { __ } from '@wordpress/i18n';
import Header from '$layout/header/header';
import Footer from '$layout/footer/footer';
import styles from './cache-debug-log.module.scss';
import clsx from 'clsx';
import { CopyToClipboard } from '@automattic/jetpack-components';
import { useDebugLog } from '$features/page-cache/lib/stores';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();

	return (
		<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
			<Header subPageTitle={ __( 'Cache Log Viewer', 'jetpack-boost' ) } />
			<div className={ clsx( 'jb-section jb-section--main', styles.section ) }>
				<div className="jb-container">
					<header className={ styles.header }>
						<h3>{ __( 'Jetpack Boost Cache Log Viewer', 'jetpack-boost' ) }</h3>
						<CopyToClipboard
							buttonStyle="icon-text"
							className={ styles[ 'copy-button' ] }
							textToCopy={ debugLog || '' }
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
