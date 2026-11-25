import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import styles from '../styles.module.scss';
import SupportLink from '../support-link';
import { getBackText } from './copy';
import type { ActionCopy } from './copy';
import type { ReactNode } from 'react';

interface StepActionsProps {
	/** The button's copy: the selected answer's or the result's. The button stays disabled without one. */
	action: ActionCopy | null;
	/** An action is running, or the host is leaving after one. */
	isBusy: boolean;
	/** The last action failed. */
	hasError: boolean;
	canGoBack: boolean;
	onContinue: () => void;
	onBack: () => void;
	/** Below the buttons; left out when the action has a link of its own. */
	footer?: ReactNode;
}

/**
 * The step's button, Back, and the action's link or the footer.
 *
 * @param {StepActionsProps} props - Component props.
 * @return {ReactNode} The actions.
 */
export default function StepActions( {
	action,
	isBusy,
	hasError,
	canGoBack,
	onContinue,
	onBack,
	footer,
}: StepActionsProps ): ReactNode {
	let label = action?.button ?? __( 'Continue', 'jetpack-connection-js' );
	if ( isBusy && action ) {
		label = action.busy ?? action.button;
	} else if ( hasError ) {
		label = __( 'Try again', 'jetpack-connection-js' );
	}

	return (
		<Stack direction="column" gap="md">
			<div className={ styles.actions }>
				<Button
					variant="solid"
					onClick={ onContinue }
					disabled={ ! action || isBusy }
					loading={ isBusy }
				>
					{ label }
				</Button>
				{ canGoBack && (
					<Button variant="minimal" onClick={ onBack } disabled={ isBusy }>
						{ getBackText() }
					</Button>
				) }
				{ action?.link && (
					<SupportLink topic={ action.link.topic }>{ action.link.text }</SupportLink>
				) }
			</div>
			{ ! action?.link && footer }
		</Stack>
	);
}
