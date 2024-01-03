import { isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { usePublicizeConfig } from '../../..';
import useDismissNotice from '../../hooks/use-dismiss-notice';
import Notice from '../notice';
import styles from './styles.module.scss';

export const AutoConversionNotice: React.FC = () => {
	const { dismissNotice, shouldShowNotice, NOTICES } = useDismissNotice();

	const onAutoConversionNoticeDismiss = useCallback(
		() => dismissNotice( NOTICES.autoConversion ),
		[ dismissNotice, NOTICES ]
	);
	const { adminUrl, jetpackSharingSettingsUrl } = usePublicizeConfig();

	return (
		! isSimpleSite() &&
		shouldShowNotice( NOTICES.autoConversion ) && (
			<Notice
				type={ 'warning' }
				actions={ [
					<Button onClick={ onAutoConversionNoticeDismiss } key="dismiss" variant="primary">
						{ __( 'Got it', 'jetpack' ) }
					</Button>,
					<Button
						className={ styles[ 'change-settings-button' ] }
						key="change-settings"
						href={ adminUrl || jetpackSharingSettingsUrl }
						target="_blank"
						rel="noreferrer noopener"
					>
						{ __( 'Change settings', 'jetpack' ) }
					</Button>,
				] }
			>
				{ __(
					'When your post is published, the selected image will be converted for maximum compatibility across your connected social networks.',
					'jetpack'
				) }
			</Notice>
		)
	);
};
