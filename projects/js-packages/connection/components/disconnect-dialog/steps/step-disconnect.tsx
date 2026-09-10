import { __ } from '@wordpress/i18n';
import { Text } from '@wordpress/ui';
import { Fragment, useCallback, useEffect } from 'react';
import ConnectedPlugins from '../../connected-plugins';
import DisconnectActionFooter from '../../shared/disconnect-action-footer';
import type { StepDisconnectProps } from './types';
import type { MouseEvent } from 'react';

/**
 * Disconnect step in disconnection flow.
 *
 * @param {StepDisconnectProps} props - The properties.
 * @return {import('react').ReactNode} - The StepDisconnect component
 */
const StepDisconnect = ( {
	title,
	isDisconnecting,
	onDisconnect,
	disconnectError,
	disconnectStepComponent,
	connectedPlugins,
	disconnectingPlugin,
	closeModal,
	context,
	trackModalClick,
}: StepDisconnectProps ) => {
	const trackLearnClick = useCallback(
		() => trackModalClick( 'jetpack_disconnect_dialog_click_learn_about' ),
		[ trackModalClick ]
	);
	const trackSupportClick = useCallback(
		() => trackModalClick( 'jetpack_disconnect_dialog_click_support' ),
		[ trackModalClick ]
	);
	const handleStayConnectedClick = useCallback( () => {
		trackModalClick( 'jetpack_disconnect_dialog_click_stay_connected' );
		closeModal();
	}, [ trackModalClick, closeModal ] );
	const handleDisconnectClick = useCallback(
		( e?: MouseEvent< HTMLElement > ) => {
			trackModalClick( 'jetpack_disconnect_dialog_click_disconnect' );
			onDisconnect( e );
		},
		[ trackModalClick, onDisconnect ]
	);
	const handleEscapePress = useCallback(
		( event: KeyboardEvent ) => {
			if ( event.key === 'Escape' && ! isDisconnecting ) {
				handleStayConnectedClick();
			}
		},
		[ handleStayConnectedClick, isDisconnecting ]
	);

	useEffect( () => {
		document.addEventListener( 'keydown', handleEscapePress );

		return () => {
			document.removeEventListener( 'keydown', handleEscapePress );
		};
	}, [ handleEscapePress ] );

	// When showing on the plugins page, the disconnect button should deactivate the plugin as well.
	let disconnectLabel: string = __( 'Disconnect', 'jetpack-connection-js' );
	if ( isDisconnecting ) {
		disconnectLabel = __( 'Disconnecting…', 'jetpack-connection-js' );
	} else if ( context === 'plugins' ) {
		disconnectLabel = __( 'Deactivate', 'jetpack-connection-js' );
	}

	const stayLabel =
		context === 'plugins'
			? __( 'Cancel', 'jetpack-connection-js' )
			: __(
					'Stay connected',
					'jetpack-connection-js',
					// @ts-expect-error Dummy arg to avoid bad minification; ignored at runtime.
					/* dummy arg to avoid bad minification */ 0
			  );

	/**
	 * Show some fallback output if there are no connected plugins to show and no passed disconnect component.
	 * This is a more generic message about disconnecting Jetpack.
	 *
	 * @return {import('react').ReactNode} - Fallback message for when there are no connected plugins or passed components to show.
	 */
	const renderFallbackOutput = () => {
		const hasOtherConnectedPlugins = ( () => {
			if ( ! connectedPlugins ) {
				return 0;
			}

			const plugins = Array.isArray( connectedPlugins )
				? connectedPlugins
				: Object.entries( connectedPlugins ).map( ( [ slug, plugin ] ) => ( { slug, ...plugin } ) );

			return plugins.filter( plugin => plugin.slug !== disconnectingPlugin ).length;
		} )();

		if ( hasOtherConnectedPlugins === 0 && ! disconnectStepComponent ) {
			return (
				<div className="jp-connection__disconnect-dialog__step-copy">
					<Text className="jp-connection__disconnect-dialog__large-text">
						{ __(
							'Jetpack is currently powering multiple products on your site.',
							'jetpack-connection-js'
						) }
						<br />
						{ __(
							'Once you disconnect Jetpack, these will no longer work.',
							'jetpack-connection-js'
						) }
					</Text>
				</div>
			);
		}

		return undefined;
	};

	return (
		<Fragment>
			<div className="jp-connection__disconnect-dialog__content">
				<h1 id="jp-connection__disconnect-dialog__heading">{ title }</h1>
				<ConnectedPlugins
					connectedPlugins={ connectedPlugins }
					disconnectingPlugin={ disconnectingPlugin }
				/>
				{ disconnectStepComponent }
				{ renderFallbackOutput() }
			</div>
			<DisconnectActionFooter
				stayLabel={ stayLabel }
				stayDisabled={ isDisconnecting }
				onStay={ handleStayConnectedClick }
				disconnectLabel={ disconnectLabel }
				disconnectDisabled={ isDisconnecting }
				onDisconnect={ handleDisconnectClick }
				trailingPeriod
				onLearnClick={ trackLearnClick }
				onSupportClick={ trackSupportClick }
				error={ disconnectError }
			/>
		</Fragment>
	);
};

export default StepDisconnect;
