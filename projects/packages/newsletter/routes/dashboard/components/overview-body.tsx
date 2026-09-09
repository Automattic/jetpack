import { JetpackIcon } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { Icon } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { close, wordpress } from '@wordpress/icons';
import { Card, IconButton, Stack } from '@wordpress/ui';
import GuidesCard from './guides-card';
import OnboardingChecklist from './onboarding-checklist';
import './overview-body.scss';

/**
 * Render the content of the Newsletter Overview tab.
 *
 * @return The Overview tab content.
 */
export default function OverviewBody(): JSX.Element {
	const [ showIntro, setShowIntro ] = useState( true );
	const dismissIntro = useCallback( () => setShowIntro( false ), [] );
	const displayName = getScriptData()?.user.current_user?.display_name ?? '';
	const title = displayName
		? sprintf(
				/* translators: %s: Current user's display name. */
				__( 'Welcome, %s', 'jetpack-newsletter' ),
				displayName
		  )
		: __( 'Welcome', 'jetpack-newsletter' );

	return (
		<Stack className="jetpack-newsletter-overview" direction="column" align="flex-start">
			<h2 className="jetpack-newsletter-overview__title">{ title }</h2>
			{ showIntro ? (
				<Card.Root className="jetpack-newsletter-overview__intro-card">
					<Card.Header className="jetpack-newsletter-overview__intro-header">
						<Card.Title>
							<Stack direction="row" align="center" gap="sm">
								<span className="jetpack-newsletter-overview__icons" aria-hidden="true">
									<Icon
										className="jetpack-newsletter-overview__wordpress-icon"
										icon={ wordpress }
										size={ 32 }
									/>
									<JetpackIcon className="jetpack-newsletter-overview__jetpack-icon" size={ 32 } />
								</span>
								<span>{ __( 'Newsletters on WordPress.com', 'jetpack-newsletter' ) }</span>
							</Stack>
						</Card.Title>
						<IconButton
							label={ __( 'Dismiss introduction', 'jetpack-newsletter' ) }
							icon={ close }
							variant="minimal"
							tone="neutral"
							onClick={ dismissIntro }
						/>
					</Card.Header>
					<Card.Content className="jetpack-newsletter-overview__content">
						<p>
							{ __(
								"A newsletter lets people subscribe with their email address, so every new post is delivered straight to their inbox. It's a simple way to build an audience you own, strengthen relationships with readers, and keep them coming back to your site.",
								'jetpack-newsletter'
							) }
						</p>
					</Card.Content>
				</Card.Root>
			) : null }
			<OnboardingChecklist />
			<GuidesCard />
		</Stack>
	);
}
