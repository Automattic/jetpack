/**
 * External dependencies
 */
import { Popover } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, close } from '@wordpress/icons';
import Button from '../button';
import useBreakpointMatch from '../layout/use-breakpoint-match';
import Text from '../text';
/**
 * Internal dependencies
 */
import styles from './styles.module.scss';
/**
 * Types
 */
import { ActionPopoverProps } from './types';
import type React from 'react';

const ActionPopover = ( {
	hideCloseButton = false,
	title,
	children,
	step = null,
	totalSteps = null,
	actionButtonText = null,
	actionButtonDisabled = false,
	offset = 32,
	onClose,
	onClick,
	...otherPopoverProps
}: ActionPopoverProps ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	if ( ! title || ! children || ! actionButtonText ) {
		return null;
	}

	if ( ! otherPopoverProps.position ) {
		otherPopoverProps.position = isSm ? 'top center' : 'middle right';
	}

	const popoverProps = {
		...otherPopoverProps,
		offset,
	};

	const showSteps = Number.isFinite( step ) && Number.isFinite( totalSteps );
	/* translators: 1 Current step, 2 Total steps */
	const stepsText = showSteps ? sprintf( __( '%1$d of %2$d', 'jetpack' ), step, totalSteps ) : null;

	return (
		<Popover { ...popoverProps }>
			<div className={ styles.wrapper }>
				<div className={ styles.header }>
					<Text variant="title-small" className={ styles.title }>
						{ title }
					</Text>
					{ ! hideCloseButton && (
						<button aria-label="close" className={ styles[ 'close-button' ] } onClick={ onClose }>
							<Icon icon={ close } size={ 16 } />
						</button>
					) }
				</div>
				{ children }
				<div className={ styles.footer }>
					{ showSteps && (
						<Text variant="body" className={ styles.steps }>
							{ stepsText }
						</Text>
					) }
					<Button
						variant="primary"
						className={ styles[ 'action-button' ] }
						disabled={ actionButtonDisabled }
						onClick={ onClick }
					>
						{ actionButtonText }
					</Button>
				</div>
			</div>
		</Popover>
	);
};

export default ActionPopover;
