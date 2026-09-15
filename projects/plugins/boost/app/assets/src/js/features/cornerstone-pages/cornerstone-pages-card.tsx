import { __ } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Stack } from '@wordpress/ui';
import LcpModule from '$features/lcp/lcp';
import { useSingleModuleState } from '$features/module/lib/stores';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCornerstoneSummary } from './cornerstone-pages';
import Meta, { CornerstonePagesUpgradeCTA } from './meta/meta';
import Prerender from './prerender/prerender';

/**
 * The Cornerstone Pages group on the modern Settings page: a collapsible page
 * editor, then the pre-render and LCP controls as rows.
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
				<Card.Title render={ <h2 /> }>{ __( 'Cornerstone Pages', 'jetpack-boost' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<CollapsibleCard.Root onOpenChange={ handleEditorToggle }>
						<CollapsibleCard.Header render={ <h3 /> }>
							<Stack direction="row" justify="space-between" align="center" gap="sm">
								<Card.Title>{ __( 'Edit cornerstone pages', 'jetpack-boost' ) }</Card.Title>
								{ summary && (
									<CollapsibleCard.HeaderDescription>
										<Badge intent="none">{ summary }</Badge>
									</CollapsibleCard.HeaderDescription>
								) }
							</Stack>
						</CollapsibleCard.Header>
						<CollapsibleCard.Content>
							<Stack direction="column" gap="md">
								<Meta />
								<CornerstonePagesUpgradeCTA />
							</Stack>
						</CollapsibleCard.Content>
					</CollapsibleCard.Root>
					{ isSpeculationRulesAvailable && <Prerender /> }
					<LcpModule />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default CornerstonePagesCard;
