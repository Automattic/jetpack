import {
	Container,
	ContextualUpgradeTrigger,
	Col,
	H3,
	Button,
	SocialIcon,
	getRedirectUrl,
	getUserLocale,
} from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { SOCIAL_STORE_ID } from '@automattic/jetpack-publicize-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, postList } from '@wordpress/icons';
import ShareCounter from '../share-counter';
import StatCards from '../stat-cards';
import styles from './styles.module.scss';

const Header = () => {
	const {
		connectionsAdminUrl,
		hasConnections,
		hasPaidPlan,
		isModuleEnabled,
		isShareLimitEnabled,
		newPostUrl,
		postsCount,
		sharesCount,
		siteSuffix,
	} = useSelect( select => {
		const store = select( SOCIAL_STORE_ID );
		return {
			connectionsAdminUrl: store.getConnectionsAdminUrl(),
			hasConnections: store.hasConnections(),
			hasPaidPlan: select( SOCIAL_STORE_ID ).hasPaidPlan(),
			isModuleEnabled: store.isModuleEnabled(),
			isShareLimitEnabled: select( SOCIAL_STORE_ID ).isShareLimitEnabled(),
			newPostUrl: `${ store.getAdminUrl() }post-new.php`,
			postsCount: select( SOCIAL_STORE_ID ).getPostsCount(),
			sharesCount: select( SOCIAL_STORE_ID ).getSharesCount(),
			siteSuffix: select( SOCIAL_STORE_ID ).getSiteSuffix(),
		};
	} );
	const { hasConnectionError } = useConnectionErrorNotice();

	const formatter = Intl.NumberFormat( getUserLocale(), {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	return (
		<>
			<Container horizontalSpacing={ 0 }>
				{ hasConnectionError && (
					<Col className={ styles[ 'connection-error-col' ] }>
						<ConnectionError />
					</Col>
				) }
				<Col>
					<div id="jp-admin-notices" className="jetpack-social-jitm-card" />
				</Col>
			</Container>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 } className={ styles.container }>
				<Col sm={ 4 } md={ 4 } lg={ 5 }>
					<H3 mt={ 2 }>{ __( 'Write once, post everywhere', 'jetpack-social' ) }</H3>
					<div className={ styles.actions }>
						{ isModuleEnabled && ! hasConnections && (
							<Button href={ connectionsAdminUrl } isExternalLink={ true }>
								{ __( 'Connect accounts', 'jetpack-social' ) }
							</Button>
						) }
						<Button href={ newPostUrl } variant="secondary">
							{ __( 'Write a post', 'jetpack-social' ) }
						</Button>
					</div>
				</Col>
				<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } }>
					{ isShareLimitEnabled && ! hasPaidPlan ? (
						<>
							<ShareCounter value={ sharesCount } max={ 30 } />
							<ContextualUpgradeTrigger
								className={ styles.cut }
								description={ __(
									'Unlock unlimited shares and advanced posting options',
									'jetpack-social'
								) }
								cta={ __( 'Get a Jetpack Social Plan', 'jetpack-social' ) }
								href={ getRedirectUrl( 'jetpack-social-admin-page-upsell', {
									site: siteSuffix,
									query: 'redirect_to=' + window.location.href,
								} ) }
								tooltipText={ __( 'Share as a post for more engagement', 'jetpack-social' ) }
							/>
						</>
					) : (
						<StatCards
							stats={ [
								{
									icon: <SocialIcon />,
									label: __( 'Total shares past 30 days', 'jetpack-social' ),
									loading: null === sharesCount,
									value: formatter.format( sharesCount ),
								},
								{
									icon: <Icon icon={ postList } />,
									label: __( 'Posted this month', 'jetpack-social' ),
									loading: null === postsCount,
									value: formatter.format( postsCount ),
								},
							] }
						/>
					) }
				</Col>
			</Container>
		</>
	);
};

export default Header;
