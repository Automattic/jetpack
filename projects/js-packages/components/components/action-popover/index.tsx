/**
 * External dependencies
 */
import { Popover } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
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
	buttonContent = null,
	buttonDisabled = false,
	buttonHref = null,
	buttonExternalLink = false,
	offset = 32,
	onClose,
	onClick,
	...otherPopoverProps
}: ActionPopoverProps ) => {
	const [ isSm ] = useBreakpointMatch( 'sm' );

	if ( ! title || ! children || ! buttonContent ) {
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
	let stepsText = null;
	if ( showSteps ) {
		stepsText = sprintf(
			/* translators: 1 Current step, 2 Total steps */
			__( '%1$d of %2$d', 'jetpack' ),
			step,
			totalSteps
		);
	}

	return (
		<Popover { ...popoverProps }>
			<div className={ styles.wrapper }>
				<div className={ styles.header }>
					<Text variant="title-small" className={ styles.title }>
						{ title }
					</Text>
					{ ! hideCloseButton && (
						<>
							<Button
								size="small"
								variant="tertiary"
								aria-label="close"
								className={ styles[ 'close-button' ] }
								icon={ close }
								iconSize={ 16 }
								onClick={ onClose }
							/>
						</>
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
						disabled={ buttonDisabled }
						onClick={ onClick }
						isExternalLink={ buttonExternalLink }
						href={ buttonHref }
					>
						{ buttonContent }
					</Button>
				</div>
			</div>
		</Popover>
	);
};

export default ActionPopover;
