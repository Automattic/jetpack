import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import { Page } from '@wordpress/admin-ui';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Tabs } from '@wordpress/ui';
import type { ReactNode } from 'react';

type Props = {
	/** Which tab is active; the edit route counts as the New tab. */
	tab: 'new' | 'flows';
	actions?: ReactNode;
	children: ReactNode;
};

/** Shared chrome: Jetpack admin header with the New / Flows tabs, and the Jetpack footer. */
export function FlowPage( { tab, actions, children }: Props ) {
	const navigate = useNavigate();

	return (
		<div className="jp-admin-page">
			<Page
				className="jp-admin-page__page"
				visual={ <JetpackLogo showText={ false } height={ 20 } /> }
				title={ __( 'Flow', 'jetpack-flow-pkg' ) }
				subTitle={ __( 'When this happens, do that.', 'jetpack-flow-pkg' ) }
				actions={ actions }
				showSidebarToggle={ false }
			>
				<Tabs.Root
					value={ tab }
					onValueChange={ ( next: string | null ) =>
						navigate( { href: next === 'flows' ? '/flows' : '/' } )
					}
					className="jetpack-flow-tabs"
				>
					<div className="jp-admin-page-tabs jp-admin-page-tabs--minimal">
						<Tabs.List variant="minimal">
							<Tabs.Tab value="new">{ __( 'New', 'jetpack-flow-pkg' ) }</Tabs.Tab>
							<Tabs.Tab value="flows">{ __( 'Flows', 'jetpack-flow-pkg' ) }</Tabs.Tab>
						</Tabs.List>
					</div>
					{ children }
				</Tabs.Root>
				{ tab === 'new' && <JetpackFooter /> }
			</Page>
		</div>
	);
}
