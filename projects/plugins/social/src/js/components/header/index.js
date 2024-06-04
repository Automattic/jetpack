import {
	Container,
	ContextualUpgradeTrigger,
	Col,
	H3,
	Button,
	SocialIcon,
	getRedirectUrl,
	getUserLocale,
	Text,
} from '@automattic/jetpack-components';
import { ConnectionError, useConnectionErrorNotice } from '@automattic/jetpack-connection';
import {
	ShareLimitsBar,
	store as socialStore,
	useShareLimits,
	ManageConnectionsModalWithTrigger as ManageConnectionsModal,
} from '@automattic/jetpack-publicize-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, postList } from '@wordpress/icons';
import StatCards from '../stat-cards';
import styles from './styles.module.scss';

const Header = () => {
	const connectionData = window.jetpackSocialInitialState.connectionData ?? {};
	const {
		hasConnections,
		isModuleEnabled,
		newPostUrl,
		postsCount,
		totalShareCount,
		siteSuffix,
		blogID,
		showShareLimits,
		hasPaidFeatures,
		useAdminUiV1,
	} = useSelect( select => {
		const store = select( socialStore );
		return {
			hasConnections: Object.keys( connectionData.connections || {} ).length > 0,
			isModuleEnabled: store.isModuleEnabled(),
			newPostUrl: `${ store.getAdminUrl() }post-new.php`,
			postsCount: store.getSharedPostsCount(),
			totalShareCount: store.getTotalSharesCount(),
			siteSuffix: store.getSiteSuffix(),
			blogID: store.getBlogID(),
			showShareLimits: store.showShareLimits(),
			hasPaidFeatures: store.hasPaidFeatures() || store.hasPaidPlan(),
			useAdminUiV1: store.useAdminUiV1(),
		};
	} );
	const { hasConnectionError } = useConnectionErrorNotice();

	const formatter = Intl.NumberFormat( getUserLocale(), {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	const { noticeType, usedCount, scheduledCount, remainingCount } = useShareLimits();

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
							<>
								{ useAdminUiV1 ? (
									<ManageConnectionsModal
										trigger={ <Button>{ __( 'Connect accounts', 'jetpack-social' ) }</Button> }
									/>
								) : (
									<Button href={ connectionData.adminUrl } isExternalLink={ true }>
										{ __( 'Connect accounts', 'jetpack-social' ) }
									</Button>
								) }
							</>
						) }
						<Button href={ newPostUrl } variant={ hasConnections ? 'primary' : 'secondary' }>
							{ __( 'Write a post', 'jetpack-social' ) }
						</Button>
					</div>
				</Col>
				<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } }>
					{ showShareLimits ? (
						<>
							<ShareLimitsBar
								usedCount={ usedCount }
								scheduledCount={ scheduledCount }
								remainingCount={ remainingCount }
								remainingLabel={ __( 'left in this cycle', 'jetpack-social' ) }
								legendCaption={ __( 'Auto-share usage', 'jetpack-social' ) }
								noticeType={ noticeType }
								className={ styles[ 'bar-wrapper' ] }
							/>
							<Text variant="small" className={ styles[ 'bar-description' ] }>
								<i>
									{ __(
										'As a free Jetpack Social user, you get 30 shares within every rolling 30-day window.',
										'jetpack-social'
									) }
								</i>
							</Text>
						</>
					) : (
						<StatCards
							stats={ [
								{
									icon: <SocialIcon />,
									label: __( 'Total shares past 30 days', 'jetpack-social' ),
									loading: null === totalShareCount,
									value: formatter.format( totalShareCount ),
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
					{ ! hasPaidFeatures ? (
						<ContextualUpgradeTrigger
							className={ styles.cut }
							description={ __( 'Unlock advanced posting options', 'jetpack-social' ) }
							cta={ __( 'Get a Jetpack Social Plan', 'jetpack-social' ) }
							href={ getRedirectUrl( 'jetpack-social-admin-page-upsell', {
								site: blogID ?? siteSuffix,
								query: 'redirect_to=admin.php?page=jetpack-social',
							} ) }
							tooltipText={ __( 'Share as a post for more engagement', 'jetpack-social' ) }
						/>
					) : null }
				</Col>
			</Container>
		</>
	);
};

export default Header;
