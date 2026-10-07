import { JetpackIcon } from '@automattic/jetpack-components';
import { getScriptData } from '@automattic/jetpack-script-data';
import { useQuery } from '@tanstack/react-query';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { wordpress } from '@wordpress/icons';
import { Card, Stack, Text, Icon } from '@wordpress/ui';
import SubscriberStatsChart from '../subscriber-stats-chart';
import GuidesCard from './guides-card';
import OnboardingChecklist from './onboarding-checklist';
import {
	isOnboardingDone,
	isStoredOnboardingDone,
	onboardingTasksQueryOptions,
} from './task-list-api';
import type { JSX } from 'react';
import './style.scss';

/**
 * Render the onboarding view: the intro, the checklist and the guides.
 *
 * @return The onboarding view.
 */
function OnboardingView(): JSX.Element {
	const displayName = getScriptData()?.user.current_user?.display_name ?? '';
	const title = displayName
		? sprintf(
				/* translators: %s: Current user's display name. */
				__( 'Welcome, %s', 'jetpack-newsletter' ),
				displayName
			)
		: __( 'Welcome', 'jetpack-newsletter' );

	return (
		<Stack className="jetpack-newsletter-overview" gap="2xl" direction="column" align="flex-start">
			<Text className="jetpack-newsletter-overview__title" render={ <h2 /> } variant="heading-2xl">
				{ title }
			</Text>
			<Card.Root className="jetpack-newsletter-overview__intro-card">
				<Stack
					className="jetpack-newsletter-overview__intro-header"
					render={ <Card.Header /> }
					direction="row"
					gap="md"
					align="center"
					justify="space-between"
				>
					<Card.Title render={ <h3 /> }>
						<Stack render={ <span /> } direction="row" align="center" gap="sm">
							<span className="jetpack-newsletter-overview__icons" aria-hidden="true">
								<Icon
									className="jetpack-newsletter-overview__wordpress-icon"
									icon={ wordpress }
									size={ 20 }
								/>
								<JetpackIcon className="jetpack-newsletter-overview__jetpack-icon" size={ 22 } />
							</span>
							{ __( 'Newsletters on WordPress.com', 'jetpack-newsletter' ) }
						</Stack>
					</Card.Title>
				</Stack>
				<Card.Content className="jetpack-newsletter-overview__content">
					<Text render={ <p /> } className="jetpack-newsletter-overview__description">
						{ __(
							"A newsletter lets people subscribe with their email address, so every new post is delivered straight to their inbox. It's a simple way to build an audience you own, strengthen relationships with readers, and keep them coming back to your site.",
							'jetpack-newsletter'
						) }
					</Text>
				</Card.Content>
			</Card.Root>
			<OnboardingChecklist />
			<GuidesCard />
		</Stack>
	);
}

/**
 * Render the content of the Newsletter Overview tab: Stats once WP.com marks onboarding as done,
 * the onboarding view until then. A done onboarding is remembered in localStorage, since it can
 * never reopen, so later visits go straight to Stats without asking WP.com.
 *
 * @return The Overview tab content.
 */
export default function OverviewBody(): JSX.Element {
	const [ storedDone ] = useState( isStoredOnboardingDone );
	const tasksQuery = useQuery( { ...onboardingTasksQueryOptions, enabled: ! storedDone } );

	if ( storedDone || ( tasksQuery.data && isOnboardingDone( tasksQuery.data ) ) ) {
		return <SubscriberStatsChart />;
	}

	return <OnboardingView />;
}
