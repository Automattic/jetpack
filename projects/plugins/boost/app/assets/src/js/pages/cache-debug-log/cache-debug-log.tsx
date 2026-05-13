import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import { CopyToClipboard, JetpackLogo } from '@automattic/jetpack-components';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useDebugLog } from '$features/page-cache/lib/stores';
import { recordBoostEvent } from '$lib/utils/analytics';
import useHideChassisChrome from '$lib/hooks/use-hide-chassis-chrome';
import styles from './cache-debug-log.module.scss';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();
	const navigate = useNavigate();

	useHideChassisChrome();
	useEffect( () => {
		recordBoostEvent( 'page_view_cache_debug_log', {} );
	}, [] );

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		navigate( '/' );
	};

	const hasLog = !! debugLog;

	return (
		<div className={ styles.page }>
			<header className={ styles.header }>
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
						<li className={ styles[ 'breadcrumb-separator' ] } aria-hidden="true">
							/
						</li>
						<li>
							<h1 className={ styles[ 'breadcrumb-current' ] }>
								{ __( 'Cache debug log', 'jetpack-boost' ) }
							</h1>
						</li>
					</HStack>
				</nav>
			</header>
			<Card.Root>
				<Card.Header>
					<Stack direction="row" justify="space-between" align="center" gap="md">
						<span className={ styles[ 'card-label' ] }>
							{ __( 'Log entries', 'jetpack-boost' ) }
						</span>
						{ hasLog && (
							<CopyToClipboard
								buttonStyle="icon-text"
								textToCopy={ debugLog || '' }
								variant="link"
								weight="regular"
							>
								{ __( 'Copy to clipboard', 'jetpack-boost' ) }
							</CopyToClipboard>
						) }
					</Stack>
				</Card.Header>
				<Card.Content>
					{ hasLog ? (
						<pre className={ styles[ 'log-text' ] }>{ debugLog }</pre>
					) : (
						<p className={ styles.empty }>
							{ __(
								'No cache events have been logged yet. Browse your site with logging enabled to start collecting entries.',
								'jetpack-boost'
							) }
						</p>
					) }
				</Card.Content>
			</Card.Root>
		</div>
	);
};

export default CacheDebugLog;
