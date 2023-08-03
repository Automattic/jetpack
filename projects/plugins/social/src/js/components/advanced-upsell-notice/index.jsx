import { Button, Container, Notice, Text, getRedirectUrl } from '@automattic/jetpack-components';
import { useDismissNotice } from '@automattic/jetpack-publicize-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;

const AdvancedUpsellNotice = () => {
	const { shouldShowNotice, dismissNotice, NOTICES } = useDismissNotice();

	const handleDismiss = useCallback( () => {
		dismissNotice( NOTICES.advancedUpgradeAdmin, 3 * MONTH_IN_SECONDS );
	}, [ dismissNotice, NOTICES ] );

	if ( ! shouldShowNotice( NOTICES.advancedUpgradeAdmin ) ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
			<div className={ styles.wrapper }>
				<Notice
					actions={ [
						<Button
							key="learn-more"
							variant="link"
							isExternalLink
							href={ getRedirectUrl( 'jetpack-social-pricing-modal' ) }
						>
							{ __( 'Learn more', 'jetpack-social' ) }
						</Button>,
					] }
					onClose={ handleDismiss }
					title={ __( 'Need more reach?', 'jetpack-social' ) }
				>
					<Text>
						{ __(
							'Get the Advanced plan and upload custom photos and videos with your social posts! You will also get access to Social Image Generator to create your own images.',
							'jetpack-social'
						) }
					</Text>
				</Notice>
			</div>
		</Container>
	);
};

export default AdvancedUpsellNotice;
