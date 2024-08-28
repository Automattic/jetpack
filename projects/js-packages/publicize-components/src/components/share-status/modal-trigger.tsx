import { Button } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { forwardRef } from 'react';
import { store as socialStore } from '../../social-store';
import { getSocialScriptData } from '../../utils/script-data';
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
		const { feature_flags } = getSocialScriptData();

		if ( ! feature_flags.useShareStatus ) {
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
