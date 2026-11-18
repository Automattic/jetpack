import { __ } from '@wordpress/i18n';
import { Button, Stack } from '@wordpress/ui';
import styles from '../styles.module.scss';
import SupportLink from '../support-link';
import type { OptionCopy } from './copy';
import type { ReactNode } from 'react';

interface StepActionsProps {
	/** The selected answer's copy; the button stays disabled without one. */
	selected: OptionCopy | null;
	/** An action is running, or the host is leaving after one. */
	isBusy: boolean;
	/** The last action failed. */
	hasError: boolean;
	canGoBack: boolean;
	onContinue: () => void;
	onBack: () => void;
}

/**
 * The step's button, Back, and the link to support.
 *
 * @param {StepActionsProps} props - Component props.
 * @return {ReactNode} The actions.
 */
export default function StepActions( {
	selected,
	isBusy,
	hasError,
	canGoBack,
	onContinue,
	onBack,
}: StepActionsProps ): ReactNode {
	let label = selected?.button ?? __( 'Continue', 'jetpack-connection-js' );
	if ( isBusy && selected ) {
		label = selected.busy ?? selected.button;
	} else if ( hasError ) {
		label = __( 'Try again', 'jetpack-connection-js' );
	}

	return (
		<Stack direction="column" gap="md">
			<Stack direction="row" gap="sm" align="center" wrap="wrap">
				<Button
					variant="solid"
					onClick={ onContinue }
					disabled={ ! selected || isBusy }
					loading={ isBusy }
				>
					{ label }
				</Button>
				{ canGoBack && (
					<Button variant="minimal" onClick={ onBack } disabled={ isBusy }>
						{ __( 'Back', 'jetpack-connection-js' ) }
					</Button>
				) }
			</Stack>
			<div className={ styles.footer }>
				<SupportLink>{ __( 'Learn more about Safe Mode', 'jetpack-connection-js' ) }</SupportLink>
			</div>
		</Stack>
	);
}
