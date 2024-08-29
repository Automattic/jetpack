import { Button } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';
import { store as socialStore } from '../../social-store';
import styles from './styles.module.scss';
import type { ButtonProps } from '@wordpress/components/build-types/button/types';

type ModalTriggerProps = ButtonProps & {
	withWrapper?: boolean;
};

/**
 * Modal trigger component.
 */
export const ModalTrigger = forwardRef(
	( { withWrapper = false, ...props }: ModalTriggerProps, ref: unknown ) => {
		const { openShareStatusModal } = useDispatch( socialStore );
		const featureFlags = useSelect( select => select( socialStore ).featureFlags(), [] );
		const shareStatus = useSelect( select => select( socialStore ).getPostShareStatus(), [] );

		// If the post is not shared anywhere, thus there is no share status or no shares, we don't need to show the trigger.
		if ( ! shareStatus || ! shareStatus.shares || shareStatus.shares.length === 0 ) {
			return null;
		}

		if ( ! featureFlags.useShareStatus ) {
			return null;
		}

		const trigger = (
			<Button variant="secondary" onClick={ openShareStatusModal } { ...props } ref={ ref }>
				{ props.children || __( 'Review sharing status', 'jetpack' ) }
			</Button>
		);

		if ( withWrapper ) {
			return <div className={ styles[ 'trigger-wrapper' ] }>{ trigger }</div>;
		}

		return trigger;
	}
);
