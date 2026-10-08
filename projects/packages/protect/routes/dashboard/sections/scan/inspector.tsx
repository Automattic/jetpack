import { Page } from '@wordpress/admin-ui';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { IconButton } from '@wordpress/ui';
import { useScan, useThreatParam } from './store';
import ThreatDetails from './threat-details';
import type { ScanThreat } from './types';

/**
 * The sidebar: details of the threat chosen in the Scan list, active or ignored.
 *
 * @return The inspector.
 */
export default function ScanInspector() {
	const [ selected, setThreat ] = useThreatParam();
	const scan = useScan();
	const isChosen = ( item: ScanThreat ) => String( item.id ) === selected;
	const threat = scan?.threats?.find( isChosen ) ?? scan?.ignored?.find( isChosen );
	const onClose = useCallback( () => setThreat(), [ setThreat ] );

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
				<ThreatDetails threat={ threat } canAct={ !! scan?.hasPlan } />
			) : (
				<div className="jp-protect-threat-details__section">
					{ __(
						'Scan no longer reports this threat. It may have been fixed.',
						'jetpack-protect-pkg'
					) }
				</div>
			) }
		</Page>
	);
}
