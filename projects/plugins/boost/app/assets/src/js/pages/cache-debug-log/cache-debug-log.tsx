import { __ } from '@wordpress/i18n';
import { Card, Stack } from '@wordpress/ui';
import { CopyToClipboard, JetpackLogo } from '@automattic/jetpack-components';
import {
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useNavigate } from 'react-router';
import BoostAdminPage from '$layout/boost-admin-page/boost-admin-page';
import { useDebugLog } from '$features/page-cache/lib/stores';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './cache-debug-log.module.scss';

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

	const hasLog = !! debugLog;

	return (
		<BoostAdminPage breadcrumbs={ breadcrumbs }>
			<Card.Root>
				<Card.Header>
					<Stack direction="row" justify="space-between" align="center" gap="md">
						<Card.Title>{ __( 'Jetpack Boost cache log viewer', 'jetpack-boost' ) }</Card.Title>
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
		</BoostAdminPage>
	);
};

export default CacheDebugLog;
