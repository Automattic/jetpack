import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Card, CollapsibleCard, Link, Stack, Text } from '@wordpress/ui';
import LcpModule from '$features/lcp/lcp';
import { useSingleModuleState } from '$features/module/lib/stores';
import Upgraded from '$features/ui/upgraded/upgraded';
import { usePremiumFeatures } from '$lib/stores/premium-features';
import { recordBoostEvent } from '$lib/utils/analytics';
import { useCustomCornerstonePages } from './lib/stores/cornerstone-pages';
import Meta, { CornerstonePagesUpgradeCTA } from './meta/meta';
import Prerender from './prerender/prerender';

const cornerstonePagesSupportLink = getRedirectUrl( 'jetpack-boost-cornerstone-pages' );

const CornerstonePages = () => {
	const premiumFeatures = usePremiumFeatures();
	const isPremium = premiumFeatures.includes( 'cornerstone-10-pages' );

	const [ moduleState ] = useSingleModuleState( 'speculation_rules' );
	const isSpeculationRulesAvailable = moduleState?.available ?? false;

	const [ cornerstonePages ] = useCustomCornerstonePages();
	const summary = ( () => {
		if ( ! Array.isArray( cornerstonePages ) ) {
			return '';
		}
		if ( cornerstonePages.length === 0 ) {
			return __( 'Homepage', 'jetpack-boost' );
		}
		return sprintf(
			/* translators: %d is the number of pages in the custom cornerstone pages list. */
			_n( 'Homepage + %d page', 'Homepage + %d pages', cornerstonePages.length, 'jetpack-boost' ),
			cornerstonePages.length
		);
	} )();

	const handleEditorToggle = ( open: boolean ) => {
		recordBoostEvent( 'cornerstone_pages_panel_toggle', {
			status: open ? 'open' : 'close',
		} );
	};

	return (
		<Card.Root>
			<Card.Header>
				<Stack direction="column" gap="xs">
					<Card.Title>
						{ __( 'Cornerstone Pages', 'jetpack-boost' ) }
						{ isPremium && <Upgraded /> }
					</Card.Title>
					<Text>
						{ createInterpolateElement(
							__(
								'List the most important pages of your site. These pages will receive specially tailored optimizations, including targeted critical CSS. The Page Speed scores are based on your homepage, which is automatically included. <link>Learn More</link>',
								'jetpack-boost'
							),
							{
								link: (
									<Link
										openInNewTab
										href={ cornerstonePagesSupportLink }
										onClick={ () => {
											recordBoostEvent( 'clicked_cornerstone_pages_learn_more', {} );
										} }
									/>
								),
							}
						) }
					</Text>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<CollapsibleCard.Root onOpenChange={ handleEditorToggle }>
						<CollapsibleCard.Header>
							<Stack direction="row" justify="space-between" align="center">
								<Card.Title>{ __( 'Edit cornerstone pages', 'jetpack-boost' ) }</Card.Title>
								{ summary && <Badge intent="none">{ summary }</Badge> }
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
					<LcpModule inline />
				</Stack>
			</Card.Content>
		</Card.Root>
	);
};

export default CornerstonePages;
