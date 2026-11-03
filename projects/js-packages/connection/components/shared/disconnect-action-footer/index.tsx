import { Button, Stack } from '@wordpress/ui';
import HelpFooter from '../help-footer';
import type { MouseEvent, ReactNode } from 'react';

export interface DisconnectActionFooterProps {
	/** Label for the dismiss ("Stay connected"/"Cancel") button. */
	stayLabel: ReactNode;
	/** Whether the dismiss button is disabled. */
	stayDisabled?: boolean;
	/** Click handler for the dismiss button. */
	onStay: () => void;
	/** Label for the disconnect button. */
	disconnectLabel: ReactNode;
	/** Whether the disconnect button is disabled. */
	disconnectDisabled?: boolean;
	/** Click handler for the disconnect button. */
	onDisconnect: ( e?: MouseEvent< HTMLElement > ) => void;
	/** Whether to render a trailing period on the help message. */
	trailingPeriod?: boolean;
	/** Optional click handler for the help "Jetpack connection" link. */
	onLearnClick?: () => void;
	/** Optional click handler for the help "contact Jetpack support" link. */
	onSupportClick?: () => void;
	/** An error message to render below the actions, if any. */
	error?: ReactNode;
}

/**
 * Shared Stay / Disconnect footer for the disconnect-dialog family of modals.
 *
 * @param {DisconnectActionFooterProps} props - The component props.
 * @return {import('react').ReactNode} - The DisconnectActionFooter component.
 */
const DisconnectActionFooter = ( {
	stayLabel,
	stayDisabled,
	onStay,
	disconnectLabel,
	disconnectDisabled,
	onDisconnect,
	trailingPeriod,
	onLearnClick,
	onSupportClick,
	error,
}: DisconnectActionFooterProps ) => {
	return (
		<div className="jp-connection__disconnect-dialog__actions">
			<Stack direction="row" align="center" gap="lg" wrap="wrap">
				<div className="jp-connection__disconnect-dialog__help">
					<HelpFooter
						namespace="jp-connection__disconnect-dialog"
						trailingPeriod={ trailingPeriod }
						onLearnClick={ onLearnClick }
						onSupportClick={ onSupportClick }
					/>
				</div>
				<Stack
					className="jp-connection__disconnect-dialog__button-wrap"
					direction="row"
					align="center"
					gap="sm"
					wrap="wrap"
				>
					<Button
						disabled={ stayDisabled }
						onClick={ onStay }
						className="jp-connection__disconnect-dialog__btn-dismiss"
					>
						{ stayLabel }
					</Button>
					<Button
						disabled={ disconnectDisabled }
						onClick={ onDisconnect }
						className="jp-connection__disconnect-dialog__btn-disconnect"
					>
						{ disconnectLabel }
					</Button>
				</Stack>
			</Stack>
			{ error && <p className="jp-connection__disconnect-dialog__error">{ error }</p> }
		</div>
	);
};

export default DisconnectActionFooter;
