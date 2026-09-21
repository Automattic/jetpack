import { Card, Stack } from '@wordpress/ui';
import { ModuleSurfaceProvider } from '$features/module/surface';
import criticalCss from '$features/critical-css/critical-css-module/critical-css-module.module.scss';
import PremiumTooltip from '$features/premium-tooltip/premium-tooltip';
import PageCacheMeta from '$features/page-cache/meta/meta';
import styles from '../../../../app/assets/src/js/pages/settings/settings.module.scss';

const Group = ( { title, children } ) => (
	<Card.Root>
		<Card.Header>
			<Card.Title render={ <h2 /> }>{ title }</Card.Title>
		</Card.Header>
		<Card.Content>
			<Stack direction="column" gap="xl">
				{ children }
			</Stack>
		</Card.Content>
	</Card.Root>
);

const Settings = () => (
	<ModuleSurfaceProvider value="row">
		<Stack direction="column" gap="xl" className={ styles.settings }>
			<Group title="Code loading optimization">
				<div className={ criticalCss[ 'tooltip-wrapper' ] }>
					<p>
						<b>You should regenerate your Critical CSS</b> whenever you make changes to the HTML or
						CSS structure of your site.
					</p>
					<PremiumTooltip />
				</div>
			</Group>
			<Group title="Image loading optimization">
				<p>The card below the tooltip, used to check what the popover paints over.</p>
			</Group>
			<Group title="Page Cache">
				<PageCacheMeta />
			</Group>
		</Stack>
	</ModuleSurfaceProvider>
);

export default Settings;
