import { __ } from '@wordpress/i18n';
import { Card, CollapsibleCard, Stack, Text } from '@wordpress/ui';
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

/**
 * The Cornerstone Pages group on the modern Settings page: the description,
 * a collapsible page editor, then the pre-render control as a row.
 */
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
		<Card.Root>
			<Card.Header>
				<Stack direction="column" gap="xs">
					<Card.Title render={ <h2 /> }>{ __( 'Cornerstone pages', 'jetpack-boost' ) }</Card.Title>
					<Text variant="body-md" className={ styles.description }>
						<CornerstonePagesDescription />
					</Text>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<CollapsibleCard.Root onOpenChange={ handleEditorToggle }>
						<CollapsibleCard.Header render={ <h3 /> }>
							<Stack direction="row" justify="space-between" align="center" gap="sm">
								{ summary && (
									<CollapsibleCard.HeaderDescription>{ summary }</CollapsibleCard.HeaderDescription>
								) }
								<Card.Title>{ __( 'Edit pages', 'jetpack-boost' ) }</Card.Title>
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
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default CornerstonePagesCard;
