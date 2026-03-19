import { __ } from '@wordpress/i18n';
import BoostAdminPage from '$layout/boost-admin-page/boost-admin-page';
import Footer from '$layout/footer/footer';
import styles from './cache-debug-log.module.scss';
import clsx from 'clsx';
import { CopyToClipboard, JetpackLogo } from '@automattic/jetpack-components';
import { useDebugLog } from '$features/page-cache/lib/stores';
import { useNavigate } from 'react-router';
import { recordBoostEvent } from '$lib/utils/analytics';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();
	const navigate = useNavigate();

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		navigate( '/' );
	};

	const breadcrumbs = (
		<nav aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) } className={ styles.breadcrumbs }>
			<HStack
				as="ul"
				className="admin-ui-breadcrumbs__list"
				spacing={ 0 }
				justify="flex-start"
				alignment="center"
			>
				<li>
					<a href="#/" onClick={ handleBack } className={ styles[ 'breadcrumb-link' ] }>
						<JetpackLogo showText={ false } height={ 20 } />
						{ 'Boost' /** "Boost" is a product name, do not translate. */ }
					</a>
				</li>
				<li>
					<h1 className={ styles[ 'breadcrumb-current' ] }>
						{ __( 'Cache debug log', 'jetpack-boost' ) }
					</h1>
				</li>
			</HStack>
		</nav>
	);

	return (
		<BoostAdminPage breadcrumbs={ breadcrumbs }>
			<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
				<div className="jb-container">
					<div id="jp-admin-notices" className="jetpack-boost-jitm-card" />
				</div>
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
		</BoostAdminPage>
	);
};

export default CacheDebugLog;
