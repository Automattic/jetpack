import { __ } from '@wordpress/i18n';
import { Button, Spinner, Stack } from '@wordpress/ui';
import { useSendStatus } from '../data/store';
import ErrorNotice from './error-notice';
import SendPage from './send-page';
import type { SendTab } from './send-page';
import type { SendStatus } from '../data/types';
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

	return (
		<SendPage
			active={ active }
			showTabs={ !! status?.account }
			flush={ flush }
			showFooter={ ! flush }
		>
			{ error && (
				<Stack direction="column" gap="md">
					<ErrorNotice message={ error } />
					<div>
						<Button variant="outline" onClick={ retry }>
							{ __( 'Try again', 'jetpack-send-pkg' ) }
						</Button>
					</div>
				</Stack>
			) }
			{ ! error && ! status && <Spinner /> }
			{ status && children( status ) }
		</SendPage>
	);
};

export default StatusGate;
