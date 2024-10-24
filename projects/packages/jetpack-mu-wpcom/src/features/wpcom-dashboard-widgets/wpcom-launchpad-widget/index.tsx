import { CircularProgressBar } from '@automattic/components';
import { useSortedLaunchpadTasks } from '@automattic/data-stores';
import { Launchpad } from '@automattic/launchpad';
import { __ } from '@wordpress/i18n';
import type { Site } from '../types';
import './style.scss';

interface Props {
	site: Site;
}

const LAUNCHPAD_CONTEXT = 'dashboard-widget';

const WpcomLaunchpadWidget = ( { site }: Props ) => {
	const { domain, siteIntent } = site;
	const {
		data: { checklist, title },
	} = useSortedLaunchpadTasks( domain, siteIntent, LAUNCHPAD_CONTEXT );

	const numberOfSteps = checklist?.length || 0;
	const completedSteps = ( checklist?.filter( task => task.completed ) || [] ).length;
	const hasChecklist = checklist !== undefined && checklist !== null;
	const launchpadTitle = hasChecklist
		? title ?? __( 'Next steps for your site', 'jetpack-mu-wpcom' )
		: ' ';

	return (
		<>
			<div className="wpcom-launchpad-widget__header">
				<h2 className="wpcom-launchpad-widget__title">{ launchpadTitle }</h2>
				{ numberOfSteps > completedSteps && (
					<div className="wpcom-launchpad-widget__progress-bar-container">
						<CircularProgressBar
							size={ 40 }
							enableDesktopScaling
							numberOfSteps={ numberOfSteps }
							currentStep={ completedSteps }
						/>
					</div>
				) }
			</div>
			<Launchpad
				siteSlug={ domain }
				checklistSlug={ siteIntent }
				launchpadContext={ LAUNCHPAD_CONTEXT }
			/>
		</>
	);
};

export default WpcomLaunchpadWidget;
