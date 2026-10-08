import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import { useThreatParam } from '../scan/store';
import ThreatDetails from '../scan/threat-details';
import { HISTORY_THREAT_PARAM, loadHistory, useHistory } from './store';

/**
 * The sidebar: details of the threat chosen in Scan history, read-only.
 *
 * @return The inspector.
 */
export default function HistoryInspector() {
	const [ selected, setThreat ] = useThreatParam( HISTORY_THREAT_PARAM );
	const { threats } = useHistory();
	const threat = threats?.find( item => String( item.id ) === selected );
	const onClose = useCallback( () => setThreat(), [ setThreat ] );

	// A shared link can open the inspector before the History tab has loaded the list.
	useEffect( () => {
		loadHistory();
	}, [] );

	return (
		<Page
			className="jp-protect-inspector"
			headingLevel={ 2 }
			hasPadding={ false }
			title={ __( 'Threat details', 'jetpack-protect-pkg' ) }
			actions={
				<IconButton
					icon={ close }
					label={ __( 'Close', 'jetpack-protect-pkg' ) }
					variant="minimal"
					tone="neutral"
					onClick={ onClose }
				/>
			}
		>
			{ threat ? (
				<ThreatDetails threat={ threat } canAct={ false } />
			) : (
				threats && (
					<div className="jp-protect-threat-details__section">
						{ __( 'Scan history no longer lists this threat.', 'jetpack-protect-pkg' ) }
					</div>
				)
			) }
		</Page>
	);
}
