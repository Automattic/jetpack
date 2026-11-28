import { AdminPage } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import JetpackFooter from '../../../compat/components/jetpack-footer';
import config from '../../../compat/config';
import SupportLink from '../../../components/support-link';
import type { ReactNode } from 'react';

const isBlazePlugin = config.isEnabled( 'is_running_in_blaze_plugin' );

interface Props {
	actions?: ReactNode;
	tabs?: ReactNode;
	children: ReactNode;
}

/**
 * The footer the standalone Blaze Ads plugin shows: its own name, no Jetpack logo.
 *
 * @return The footer.
 */
function BlazePluginFooter() {
	return <JetpackFooter name="Blaze Ads" />;
}

/**
 * The Blaze page chrome: the shared Jetpack admin page header and footer.
 *
 * @param props          - Props.
 * @param props.actions  - Header actions.
 * @param props.tabs     - Tab strip rendered under the header.
 * @param props.children - Page body.
 * @return The page.
 */
export default function BlazePage( { actions, tabs, children }: Props ) {
	return (
		<AdminPage
			className="promote-post-i2__page"
			title="Blaze Ads" // Product name, not translated.
			subTitle={ createInterpolateElement(
				__(
					'Promote your posts and pages across WordPress.com and Tumblr. <learnMoreLink>Learn more</learnMoreLink>.',
					'jetpack-blaze'
				),
				{ learnMoreLink: <SupportLink /> }
			) }
			logo={ isBlazePlugin ? <span /> : undefined }
			actions={ actions }
			tabs={ tabs }
			showFooter={ ! isBlazePlugin }
			unwrapped
		>
			{ children }
			{ isBlazePlugin && <BlazePluginFooter /> }
		</AdminPage>
	);
}
