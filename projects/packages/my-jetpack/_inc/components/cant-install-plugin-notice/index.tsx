import { __, sprintf } from '@wordpress/i18n';
import { Link, Notice, Text } from '@wordpress/ui';
import { PRODUCT_STATUSES } from '../../constants';

type CantInstallPluginNoticeProps = {
	productName: string;
	pluginSlug: string;
};

/**
 * Whether a product's plugin is missing and the server won't let My Jetpack install it.
 *
 * @param status                - The product's status.
 * @param fileSystemWriteAccess - The site's `fileSystemWriteAccess` value, `yes` or `no`.
 * @return True when the plugin has to be installed by hand.
 */
export function isPluginInstallBlocked( status?: string, fileSystemWriteAccess?: string ): boolean {
	return status === PRODUCT_STATUSES.ABSENT && fileSystemWriteAccess === 'no';
}

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
