import { useState } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { IsaCounts } from '$features/image-size-analysis';
import { useNavigate, Link } from 'react-router-dom';
import { getGroupLabel, isaGroupKeys } from '$features/image-size-analysis/lib/isa-groups';

interface TabsProps {
	currentTab?: IsaCounts;
	activeGroupKey: string;
	imageDataGroupTabs?: Record< isaGroupKeys | string, IsaCounts >;
	setActiveTab: ( tab: isaGroupKeys ) => void;
}

const Tabs: React.FC< TabsProps > = ( {
	currentTab,
	activeGroupKey,
	imageDataGroupTabs,
	setActiveTab,
} ) => {
	const [ dropdownOpen, setDropdownOpen ] = useState( false );
	const navigate = useNavigate();
	const selectGroup = ( group: string ) => {
		navigate( `/image-size-analysis/${ group }/1` );
		setDropdownOpen( false );
	};

	const onClickDropdown = () => {
		setDropdownOpen( ! dropdownOpen );
	};
	return (
		currentTab &&
		imageDataGroupTabs &&
		activeGroupKey && (
			<div>
				<div className="jb-dropdown">
					{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
					<div className="jb-dropdown__head-bar" onClick={ onClickDropdown }>
						{ getGroupLabel( activeGroupKey ) }
						{ currentTab && currentTab.issue_count > 0 && (
							<span className="jb-dropdown__issues">{ currentTab.issue_count }</span>
						) }
						<span className="dashicons dashicons-arrow-down-alt2" />
					</div>

					{ dropdownOpen && (
						<ul className="jb-dropdown__options">
							{ Object.entries( imageDataGroupTabs ).map( ( [ group, details ] ) => (
								// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
								<li
									key={ group }
									className={ `jb-dropdown__item ${ details.issue_count > 0 ? 'active' : '' } ${
										activeGroupKey === group ? 'selected' : ''
									}` }
									onClick={ () => details.issue_count > 0 && selectGroup( group ) }
								>
									{ getGroupLabel( group ) }
									<span className="jb-dropdown__issues">{ details.issue_count }</span>
								</li>
							) ) }
						</ul>
					) }
				</div>

				<div className="jb-tabs">
					{ Object.entries( imageDataGroupTabs ).map( ( [ group, details ] ) => {
						const label = getGroupLabel( group );
						const issues = details.issue_count;

						return (
							<div
								key={ group }
								className={ `jb-tab jb-tab--${ group } ${
									activeGroupKey === group ? 'active' : ''
								}` }
							>
								<div className="jb-tab__header">
									{ issues > 0 ? (
										<Link
											className="jb-navigator-link"
											to={ `/image-size-analysis/${ group }/1` }
											onClick={ () => {
												recordBoostEvent( 'clicked_isa_report_group', { group } );
												setActiveTab( group as isaGroupKeys );
											} }
										>
											{ label }
											<span>{ issues }</span>
										</Link>
									) : (
										<div className="jb-navigator-link jb-navigator-link--inactive">
											{ label }
											<span>{ issues }</span>
										</div>
									) }
								</div>
							</div>
						);
					} ) }
				</div>
			</div>
		)
	);
};

export default Tabs;
