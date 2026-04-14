import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import { forwardRef, useCallback } from 'react';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';
import type { ComponentPropsWithoutRef } from 'react';

// @todo We only really want the ButtonProps defined in @wordpress/components/build-types/button/types.d.ts,
// without DeprecatedButtonProps, but that's not exported anywhere. 🤷
type ButtonProps = ComponentPropsWithoutRef< typeof Button >;

type ModalTriggerProps = ButtonProps & {
	withWrapper?: boolean;
	analyticsData?: { location: string };
};

/**
 * Modal trigger component.
 */
export const ModalTrigger = forwardRef< HTMLButtonElement, ModalTriggerProps >(
	( { withWrapper = false, analyticsData = null, ...props }, ref ) => {
		const { recordEvent } = useAnalytics();
		const { openUnifiedModal } = useDispatch( socialStore );
		const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

		const onButtonClicked = useCallback( () => {
			recordEvent( 'jetpack_social_share_status_modal_opened', analyticsData );

			openUnifiedModal( { initialPath: '/sharing-activity', isScreenLocked: true } );
		}, [ analyticsData, openUnifiedModal, recordEvent ] );

		// If the post is not shared anywhere, thus there is no share status or no shares, we don't need to show the trigger.
		if ( ! shareStatus || ! shareStatus.shares || shareStatus.shares.length === 0 ) {
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
				{ props.children || __( 'View sharing activity', 'jetpack-publicize-pkg' ) }
			</Button>
		);

		if ( withWrapper ) {
			return <div className={ styles[ 'trigger-wrapper' ] }>{ trigger }</div>;
		}

		return trigger;
	}
);
