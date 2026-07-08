import { Button } from '@wordpress/components';
import { check, copy } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { Link, Text } from '@wordpress/ui';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import clsx from 'clsx';
import BoostAdminPage from '$layout/boost-admin-page/boost-admin-page';
import { useDebugLog } from '$features/page-cache/lib/stores';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './cache-debug-log.module.scss';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();
	const navigate = useNavigate();
	const [ hasCopied, setHasCopied ] = useState( false );
	const copyTimer = useRef< ReturnType< typeof setTimeout > | undefined >();

	useEffect( () => {
		// Clear the "Copied!" reset timer on unmount.
		return () => {
			if ( copyTimer.current ) {
				clearTimeout( copyTimer.current );
			}
		};
	}, [] );

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		navigate( '/' );
	};

	const handleCopy = () => {
		navigator.clipboard.writeText( debugLog || '' );
		setHasCopied( true );
		if ( copyTimer.current ) {
			clearTimeout( copyTimer.current );
		}
		copyTimer.current = setTimeout( () => setHasCopied( false ), 3000 );
	};

	// Kept as a variable (and reused as the aria-label) so the minifier can't
	// collapse the two `__()` calls into `__( cond ? a : b, … )`, which breaks
	// the i18n string extraction in production builds.
	const copyLabel = __( 'Copy to clipboard', 'jetpack-boost' );

	const breadcrumbs = (
		<nav aria-label={ __( 'Breadcrumbs', 'jetpack-boost' ) }>
			<ul className={ styles.breadcrumbs }>
				<li>
					<Text variant="body-lg">
						<Link tone="neutral" href="#/" onClick={ handleBack }>
							{ 'Boost' /** "Boost" is a product name, do not translate. */ }
						</Link>
					</Text>
					<Text variant="body-lg" aria-hidden="true" className={ styles.separator }>
						/
					</Text>
				</li>
				<li>
					<Text variant="heading-lg" className={ styles[ 'breadcrumb-current' ] }>
						{ __( 'Cache debug log', 'jetpack-boost' ) }
					</Text>
				</li>
			</ul>
		</nav>
	);

	return (
		<BoostAdminPage breadcrumbs={ breadcrumbs }>
			<div id="jb-dashboard" className="jb-dashboard jb-dashboard--main">
				<div className={ clsx( 'jb-section jb-section--main', styles.section ) }>
					<div className="jb-container">
						<div id="jp-admin-notices" className="jetpack-boost-jitm-card" />
						<header className={ styles.header }>
							<h3>{ __( 'Jetpack Boost Cache Log Viewer', 'jetpack-boost' ) }</h3>
							<Button
								variant="link"
								className={ styles[ 'copy-button' ] }
								icon={ hasCopied ? check : copy }
								onClick={ handleCopy }
								aria-label={ copyLabel }
							>
								{ hasCopied ? __( 'Copied!', 'jetpack-boost' ) : copyLabel }
							</Button>
						</header>

						<pre className={ styles[ 'log-text' ] }>{ debugLog }</pre>
					</div>
				</div>
			</div>
		</BoostAdminPage>
	);
};

export default CacheDebugLog;
