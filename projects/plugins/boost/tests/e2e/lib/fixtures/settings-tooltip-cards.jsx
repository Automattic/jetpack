import { IconTooltip } from '@automattic/jetpack-components';
import { image, pending } from '@wordpress/icons';
import { Card, CollapsibleCard, Icon, Stack } from '@wordpress/ui';
import { ModuleSurfaceProvider, useTooltipLayer } from '$features/module/surface';
import criticalCss from '$features/critical-css/critical-css-module/critical-css-module.module.scss';
import tooltipStyles from '$features/premium-tooltip/premium-tooltip.module.scss';
import UpgradeNotice from '$features/upgrade-cta/upgrade-notice';
import styles from '../../../../app/assets/src/js/pages/settings/settings.module.scss';

const Group = ( { title, description, icon, children } ) => (
	<CollapsibleCard.Root defaultOpen>
		<CollapsibleCard.Header render={ <h2 /> }>
			<Stack direction="column" gap="md">
				<Card.Title>
					<Stack direction="row" align="center" gap="sm">
						<Icon icon={ icon } />
						{ title }
					</Stack>
				</Card.Title>
				<CollapsibleCard.HeaderDescription>{ description }</CollapsibleCard.HeaderDescription>
			</Stack>
		</CollapsibleCard.Header>
		<CollapsibleCard.Content>
			<Stack direction="column" gap="xl" className={ styles.rows }>
				{ children }
			</Stack>
		</CollapsibleCard.Content>
	</CollapsibleCard.Root>
);

// Stands in for a row tooltip holding a CTA, to exercise the portaled layer.
const SettingsTooltip = () => {
	const tooltipLayer = useTooltipLayer();
	return (
		<IconTooltip
			title="Upgrade options"
			label="Upgrade information"
			placement="bottom"
			className={ tooltipStyles.tooltip }
			popoverClassName={ tooltipStyles.popover }
			{ ...tooltipLayer }
			iconSize={ 22 }
			wide
			offset={ 12 }
		>
			<UpgradeNotice identifier="critical-css" description="Automatic Critical CSS regeneration." />
		</IconTooltip>
	);
};

const Settings = () => (
	<ModuleSurfaceProvider value="row">
		<Stack direction="column" gap="xl" className={ styles.settings }>
			<Group
				title="Page loading"
				description="Manage how your page content is loaded for visitors."
				icon={ pending }
			>
				<div className={ criticalCss[ 'tooltip-wrapper' ] }>
					<p>
						<b>You should regenerate your Critical CSS</b> whenever you make changes to the HTML or
						CSS structure of your site.
					</p>
					<SettingsTooltip />
					{ /* Stands in for the real card's Generate button: what Tab should reach next. */ }
					<button type="button">Generate</button>
				</div>
			</Group>
			<Group
				title="Images"
				description="Tools to load and deliver images more efficiently."
				icon={ image }
			>
				<p>The card below the tooltip, used to check what the popover paints over.</p>
			</Group>
		</Stack>
	</ModuleSurfaceProvider>
);

export default Settings;
