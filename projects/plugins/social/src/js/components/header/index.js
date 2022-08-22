import {
	Container,
	Col,
	H3,
	Button,
	SocialIcon,
	getUserLocale,
} from '@automattic/jetpack-components';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { Icon, postList } from '@wordpress/icons';
import { STORE_ID } from '../../store';
import ShareCounter from '../share-counter';
import StatCards from '../stat-cards';
import styles from './styles.module.scss';

const Header = () => {
	const {
		hasConnections,
		isModuleEnabled,
		connectionsAdminUrl,
		sharesCount,
		postsCount,
		isShareLimitEnabled,
	} = useSelect( select => {
		const store = select( STORE_ID );
		return {
			hasConnections: store.hasConnections(),
			isModuleEnabled: store.isModuleEnabled(),
			connectionsAdminUrl: store.getConnectionsAdminUrl(),
			sharesCount: select( STORE_ID ).getSharesCount(),
			postsCount: select( STORE_ID ).getPostsCount(),
			isShareLimitEnabled: select( STORE_ID ).isShareLimitEnabled(),
		};
	} );

	const formatter = Intl.NumberFormat( getUserLocale(), {
		notation: 'compact',
		compactDisplay: 'short',
	} );

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 } className={ styles.container }>
			<Col sm={ 4 } md={ 4 } lg={ 5 }>
				<H3 mt={ 2 }>{ __( 'Write once, post everywhere', 'jetpack-social' ) }</H3>
				<div className={ styles.actions }>
					{ isModuleEnabled && ! hasConnections && (
						<Button href={ connectionsAdminUrl } isExternalLink={ true }>
							{ __( 'Connect accounts', 'jetpack-social' ) }
						</Button>
					) }
					<Button href={ '/wp-admin/post-new.php' } variant="secondary">
						{ __( 'Write a post', 'jetpack-social' ) }
					</Button>
				</div>
			</Col>
			<Col sm={ 4 } md={ 4 } lg={ { start: 7, end: 12 } }>
				{ isShareLimitEnabled ? (
					<ShareCounter value={ sharesCount } max={ 30 } />
				) : (
					<StatCards
						stats={ [
							{
								icon: <SocialIcon />,
								label: __( 'Total shares this month', 'jetpack-social' ),
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
	);
};

export default Header;
