import type { MouseEvent, ReactElement } from 'react';

export interface StepDisconnectProps {
	/** The title to show for this section. */
	title?: string;
	/** Whether or not a request to disconnect is in progress. */
	isDisconnecting?: boolean;
	/** Callback function that is triggered by clicking the "Disconnect" button. */
	onDisconnect: ( e?: MouseEvent< HTMLElement > ) => void;
	/** An error message from a failed disconnect request, or false if none. */
	disconnectError?: string | false;
	/** A component to be rendered as part of this step. */
	disconnectStepComponent?: ReactElement;
	/**
	 * Plugins that are using the Jetpack connection. Accepts either an array of
	 * plugins (modern) or a legacy object keyed by slug (classic dashboard).
	 */
	connectedPlugins?: Array< { name: string; slug: string } > | Record< string, { name: string } >;
	/** The slug of the plugin that is initiating the disconnection. */
	disconnectingPlugin?: string;
	/** Callback function that closes the modal. */
	closeModal: () => void;
	/** Where this modal is being rendered. */
	context?: string;
	/** Callback that tracks link/button clicks. */
	trackModalClick: ( target: string ) => void;
}
