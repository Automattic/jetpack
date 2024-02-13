import { __ } from '@wordpress/i18n';
import Header from '$layout/header/header';
import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { z } from 'zod';
import Footer from '$layout/footer/footer';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDataSync( 'jetpack_boost_ds', 'cache_debug_log', z.string() );
	return (
		<div id="jb-dashboard" className="jb-dashboard">
			<Header subPageTitle={ __( 'Cache Debug Log', 'jetpack-boost' ) } />
			<div className="jb-section--alt">
				<div className="jb-container">
					<pre>{ debugLog }</pre>
				</div>
			</div>
			<div className="jb-section">
				<div className="jb-container">
					<Footer />
				</div>
			</div>
		</div>
	);
};

export default CacheDebugLog;
