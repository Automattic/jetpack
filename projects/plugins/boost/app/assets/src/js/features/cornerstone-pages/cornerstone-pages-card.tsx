import { __ } from '@wordpress/i18n';
import { CollapsibleCard, Stack, Text } from '@wordpress/ui';
import { useSingleModuleState } from '$features/module/lib/stores';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCornerstoneSummary } from './cornerstone-pages';
import {
	CornerstonePagesDescription,
	CornerstonePagesEditor,
	CornerstonePagesUpgradeCTA,
} from './meta/meta';
import Prerender from './prerender/prerender';
import styles from './cornerstone-pages-card.module.scss';

const CornerstonePagesCard = () => {
	const [ moduleState ] = useSingleModuleState( 'speculation_rules' );
	const isSpeculationRulesAvailable = moduleState?.available ?? false;
	const summary = useCornerstoneSummary();

	const handleEditorToggle = ( open: boolean ) => {
		recordBoostEvent( 'cornerstone_pages_panel_toggle', {
			status: open ? 'open' : 'close',
		} );
	};

	return (
		<>
			<Text variant="body-md" render={ <p /> } className={ styles.description }>
				<CornerstonePagesDescription />
			</Text>
			<CollapsibleCard.Root onOpenChange={ handleEditorToggle }>
				<CollapsibleCard.Header render={ <h3 /> }>
					<Stack direction="row" justify="space-between" align="center" gap="sm">
						{ summary && <Text variant="body-md">{ summary }</Text> }
						<Text variant="body-md" className={ styles.edit }>
							{ __( 'Edit pages', 'jetpack-boost' ) }
						</Text>
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="md">
						<CornerstonePagesEditor />
						<CornerstonePagesUpgradeCTA />
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
			{ isSpeculationRulesAvailable && <Prerender /> }
		</>
	);
};

export default CornerstonePagesCard;
