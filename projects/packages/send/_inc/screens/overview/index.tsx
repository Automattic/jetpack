import { speak } from '@wordpress/a11y';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { useSetupModeContext } from '../../components/setup-mode';
import Dashboard from './dashboard';
import { SENDING_TITLE_ID } from './sending-card';
import { setupMode } from './setup/model';
import SetupPage from './setup/setup-page';
import { fromLine } from './setup-step';
import type { SetupMode } from './setup/model';
import type { SendStatus } from '../../data/types';

const OverviewScreen = ( { status }: { status: SendStatus } ) => {
	const { account } = status;
	const context = useSetupModeContext();
	// Outside StatusGate (tests), decide here, once per mount.
	const [ ownMode, setOwnMode ] = useState< SetupMode >( () => setupMode( status ) );
	const decided = context?.mode ?? ownMode;
	const mode: SetupMode = account ? decided : 'setup';
	const [ justFinished, setJustFinished ] = useState( false );
	const finishContext = context?.finish;

	const onFinish = useCallback( () => {
		setJustFinished( true );
		if ( finishContext ) {
			finishContext();
		} else {
			setOwnMode( 'active' );
		}
	}, [ finishContext ] );

	// The Sending card already shows Active with the From line, so Finish announces it and moves
	// focus there instead of adding a notice that says it again.
	useEffect( () => {
		if ( ! justFinished || mode !== 'active' ) {
			return;
		}
		speak(
			sprintf(
				/* translators: %s: the From line, like "Example Site <owner@example.com>". */
				__( 'Sending is on. Your site’s emails now come from %s.', 'jetpack-send-pkg' ),
				fromLine( status )
			)
		);
		window.requestAnimationFrame( () => document.getElementById( SENDING_TITLE_ID )?.focus() );
		// Once, right after Finish.
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ justFinished, mode ] );

	return (
		<>
			{ status.reset_warning && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ sprintf(
							/* translators: %s: error message from the email service. */
							__(
								'Send was reset, but its sending account could not be removed: %s',
								'jetpack-send-pkg'
							),
							status.reset_warning
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			{ mode === 'setup' && <SetupPage status={ status } onFinish={ onFinish } /> }
			{ mode === 'active' && account && <Dashboard status={ status } account={ account } /> }
		</>
	);
};

export default OverviewScreen;
