import { __ } from '@wordpress/i18n';
import { Button, Card, Stack } from '@wordpress/ui';
import { JetpackLogo } from '@automattic/jetpack-components';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { useDebugLog } from '$features/page-cache/lib/stores';
import { recordBoostEvent } from '$lib/utils/analytics';
import useEnterSubPage from '$lib/hooks/use-hide-chassis-chrome';
import styles from './cache-debug-log.module.scss';

const CacheDebugLog = () => {
	const [ { data: debugLog } ] = useDebugLog();
	const navigate = useNavigate();
	const [ copied, setCopied ] = useState( false );

	useEnterSubPage();
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

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText( debugLog || '' );
			recordBoostEvent( 'cache_debug_log_copied', {} );
			setCopied( true );
			setTimeout( () => setCopied( false ), 1500 );
		} catch {
			// noop — clipboard permissions denied / unavailable
		}
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
						<Card.Title>{ __( 'Cache log', 'jetpack-boost' ) }</Card.Title>
						{ hasLog && (
							<Button variant="outline" tone="neutral" size="compact" onClick={ handleCopy }>
								{ copied
									? __( 'Copied!', 'jetpack-boost' )
									: __( 'Copy to clipboard', 'jetpack-boost' ) }
							</Button>
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
