import { useCallback, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Spinner, Stack } from '@wordpress/ui';
import { useSendStatus } from '../data/store';
import { setupMode } from '../screens/overview/setup/model';
import ErrorNotice from './error-notice';
import SendPage from './send-page';
import { SetupModeContext } from './setup-mode';
import type { SendTab } from './send-page';
import type { SendStatus } from '../data/types';
import type { SetupMode } from '../screens/overview/setup/model';
import type { ReactNode } from 'react';

type Props = {
	active: SendTab;
	/** Full-bleed layout with no footer, for DataViews tabs. */
	fullBleed?: boolean;
	children: ( status: SendStatus ) => ReactNode;
};

/**
 * Page chrome plus loading and error states around a route's screen.
 *
 * @param props           - Component props.
 * @param props.active    - The active tab.
 * @param props.fullBleed - Render full-bleed once the site is set up.
 * @param props.children  - Renders the screen once status is loaded.
 * @return The route content.
 */
const StatusGate = ( { active, fullBleed = false, children }: Props ) => {
	const { status, error, retry } = useSendStatus();
	// Before setup these routes show the Overview, which keeps the padded layout.
	const flush = fullBleed && !! status?.account;

	// Decided on the first status, so a test landing mid-visit doesn't swap the page out.
	const [ decided, setDecided ] = useState< SetupMode | null >( null );
	const firstMode: SetupMode | null = decided ?? ( status ? setupMode( status ) : null );
	if ( status && decided === null ) {
		setDecided( firstMode );
	}
	// Without an account there's nothing to show but setup, e.g. right after a reset.
	const mode: SetupMode | null = status && ! status.account ? 'setup' : firstMode;
	const finish = useCallback( () => setDecided( 'active' ), [] );
	const context = useMemo( () => ( mode ? { mode, finish } : null ), [ mode, finish ] );
	const showsOverview = active === 'overview' || ! status?.account;

	return (
		<SetupModeContext.Provider value={ context }>
			<SendPage
				// Before an account exists every route shows setup, under the Overview tab.
				active={ status && ! status.account ? 'overview' : active }
				showTabs={ !! status?.account }
				// While it records, and on its own screen, so the open tab never vanishes under the page.
				showDebugTab={ !! status?.debug_log?.enabled || active === 'debug-log' }
				flush={ flush }
				wide={ showsOverview }
				devMode={ status?.provisioner === 'local' }
				showFooter={ ! flush }
			>
				{ error && (
					<Stack direction="column" gap="md">
						<ErrorNotice message={ error } />
						<div>
							<Button variant="outline" tone="neutral" onClick={ retry }>
								{ __( 'Try again', 'jetpack-send-pkg' ) }
							</Button>
						</div>
					</Stack>
				) }
				{ ! error && ! status && <Spinner /> }
				{ status && children( status ) }
			</SendPage>
		</SetupModeContext.Provider>
	);
};

export default StatusGate;
