import { Button, Container, Notice } from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
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

const InstagramNotice = () => {
	const [ showNotice, setShowNotice ] = useState( true );

	const hasAdvancedPlan = useSelect( select => select( STORE_ID ).hasAdvancedPlan() );

	const handleDismiss = useCallback( () => {
		apiFetch( {
			path: `jetpack/v4/social/dismiss-notice`,
			method: 'POST',
			data: { notice: 'instagram' },
		} ).catch( error => {
			throw error;
		} );

		setShowNotice( false );
	}, [] );

	if ( ! showNotice ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.wrapper }>
				<Notice
					actions={ [
						<Button key="install" variant="primary">
							Install now
						</Button>,
						<Button key="learn-more" variant="link" isExternalLink>
							Install now
						</Button>,
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
