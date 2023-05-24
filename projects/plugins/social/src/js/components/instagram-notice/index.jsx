import {
	Button as JetpackButton,
	Container,
	Notice,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { useDismissNotice } from '@automattic/jetpack-publicize-components';
import { useSelect } from '@wordpress/data';
import { useState, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { STORE_ID } from '../../store';
import styles from './styles.module.scss';

const freePlanNoticeText = __(
	'Share featured images directly to your Instagram Business account for free, or share unlimited photos and video reels with Jetpack Social Advanced.',
	'jetpack-social'
);
const paidPlanNoticeText = __(
	'Enjoy automatically sharing unlimited photos and video reels to Instagram Business with your Jetpack Social Advanced plan!',
	'jetpack-social'
);

const InstagramNotice = ( { onUpgrade = () => {} } = {} ) => {
	const [ showNotice, setShowNotice ] = useState( true );
	const { dismissedNotices, dismissNotice } = useDismissNotice();

	const { connectionsAdminUrl, hasAdvancedPlan } = useSelect( select => {
		const store = select( STORE_ID );
		return {
			connectionsAdminUrl: store.getConnectionsAdminUrl(),
			hasAdvancedPlan: store.hasAdvancedPlan(),
		};
	} );

	const handleDismiss = useCallback( () => {
		dismissNotice( 'instagram' );
		setShowNotice( false );
	}, [ dismissNotice, setShowNotice ] );

	if ( ! showNotice || dismissedNotices.includes( 'instagram' ) ) {
		return null;
	}

	const Button = () =>
		hasAdvancedPlan ? (
			<JetpackButton key="connect" variant="primary" href={ connectionsAdminUrl } isExternalLink>
				{ __( 'Connect Instagram', 'jetpack-social' ) }
			</JetpackButton>
		) : (
			<JetpackButton key="upgrade" variant="primary" onClick={ onUpgrade }>
				{ __( 'Upgrade now', 'jetpack-social' ) }
			</JetpackButton>
		);

	return (
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.wrapper }>
				<Notice
					actions={ [
						<Button />,
						<JetpackButton
							key="learn-more"
							variant="link"
							isExternalLink
							href={ getRedirectUrl( 'jetpack-social-connecting-to-social-networks' ) }
						>
							{ __( 'Learn more', 'jetpack-social' ) }
						</JetpackButton>,
					] }
					onClose={ handleDismiss }
					title={ __( 'Instagram is now available in Jetpack Social', 'jetpack-social' ) }
				>
					{ hasAdvancedPlan ? paidPlanNoticeText : freePlanNoticeText }
				</Notice>
			</div>
		</Container>
	);
};

export default InstagramNotice;
