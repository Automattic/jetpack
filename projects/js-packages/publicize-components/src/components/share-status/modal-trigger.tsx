import { siteHasFeature } from '@automattic/jetpack-script-data';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { forwardRef, useCallback } from 'react';
import { store as socialStore } from '../../social-store';
import { features } from '../../utils/constants';
import styles from './styles.module.scss';
import type { ButtonProps } from '@wordpress/components/build-types/button/types';

type ModalTriggerProps = ButtonProps & {
	withWrapper?: boolean;
	analyticsData?: { location: string };
};

/**
 * Modal trigger component.
 */
export const ModalTrigger = forwardRef(
	( { withWrapper = false, analyticsData = null, ...props }: ModalTriggerProps, ref: unknown ) => {
		const { recordEvent } = useAnalytics();
		const { openShareStatusModal } = useDispatch( socialStore );
		const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

		const onButtonClicked = useCallback( () => {
			recordEvent( 'jetpack_social_share_status_modal_opened', analyticsData );
			openShareStatusModal();
		}, [ analyticsData, openShareStatusModal, recordEvent ] );

		// If the post is not shared anywhere, thus there is no share status or no shares, we don't need to show the trigger.
		if ( ! shareStatus || ! shareStatus.shares || shareStatus.shares.length === 0 ) {
			return null;
		}

		if ( ! siteHasFeature( features.SHARE_STATUS ) ) {
			return null;
		}

		const trigger = (
			<Button
				variant="secondary"
				onClick={ onButtonClicked }
				{ ...props }
				className={ clsx( styles.trigger, props.className ) }
				ref={ ref }
			>
				{ props.children || __( 'View sharing history', 'jetpack-publicize-components' ) }
			</Button>
		);

		if ( withWrapper ) {
			return <div className={ styles[ 'trigger-wrapper' ] }>{ trigger }</div>;
		}

		return trigger;
	}
);
