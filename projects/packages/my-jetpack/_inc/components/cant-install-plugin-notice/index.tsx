import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice, Text } from '@wordpress/ui';

type CantInstallPluginNoticeProps = {
	productName: string;
	pluginSlug: string;
};

/**
 * Asks the site owner to install a product's plugin by hand, for servers where My Jetpack can't write plugin files.
 *
 * @param props             - Component props.
 * @param props.productName - The product name the notice uses for the plugin.
 * @param props.pluginSlug  - The plugin's WordPress.org slug.
 * @return The notice.
 */
export default function CantInstallPluginNotice( {
	productName,
	pluginSlug,
}: CantInstallPluginNoticeProps ) {
	return (
		<Notice.Root intent="warning" role="status">
			<Notice.Description render={ <div /> }>
				<Text
					variant="body-lg"
					style={ { margin: 0 } }
					render={
						<p>
							{ sprintf(
								// translators: %s is the plugin name.
								__(
									"Due to your server settings, we can't automatically install the plugin for you. Please manually install the %s plugin.",
									'jetpack-my-jetpack'
								),
								productName
							) }
							&nbsp;
							<Link openInNewTab href={ `https://wordpress.org/plugins/${ pluginSlug }` }>
								{ __( 'Get plugin', 'jetpack-my-jetpack' ) }
							</Link>
						</p>
					}
				></Text>
			</Notice.Description>
		</Notice.Root>
	);
}
