import { useState, useEffect } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { IsaCounts } from '$features/image-size-analysis';
import { navigate } from '$lib/utils/navigate';

interface TabsProps {
	activeGroup: string;
	imageDataGroupTabs: Record< string, IsaCounts >;
	isaGroupLabels: Record< string, string >;
}

const Tabs: React.FC< TabsProps > = ( { activeGroup, imageDataGroupTabs, isaGroupLabels } ) => {
	const [ dropdownOpen, setDropdownOpen ] = useState( false );
	const [ currentTab, setCurrentTab ] = useState< IsaCounts | undefined >( undefined );

	useEffect( () => {
		setCurrentTab( imageDataGroupTabs[ activeGroup ] );
	}, [ activeGroup, imageDataGroupTabs ] );

	const selectGroup = ( group: string ) => {
		navigate( `/image-size-analysis/${ group }/1` );
		setDropdownOpen( false );
	};

	const onClickDropdown = () => {
		setDropdownOpen( ! dropdownOpen );
	};

	return (
		<div>
			<div className="jb-dropdown">
				{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
				<div className="jb-dropdown__head-bar" onClick={ onClickDropdown }>
					{ isaGroupLabels[ activeGroup ] }
					{ currentTab && currentTab?.issue_count > 0 && (
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
									activeGroup === group ? 'selected' : ''
								}` }
								onClick={ () => details.issue_count > 0 && selectGroup( group ) }
							>
								{ isaGroupLabels[ group ] }
								<span className="jb-dropdown__issues">{ details.issue_count }</span>
							</li>
						) ) }
					</ul>
				) }
			</div>

			<div className="jb-tabs">
				{ Object.entries( imageDataGroupTabs ).map( ( [ group, details ] ) => {
					const label = isaGroupLabels[ group ];
					const issues = details.issue_count;

					return (
						<div
							key={ group }
							className={ `jb-tab jb-tab--${ group } ${ activeGroup === group ? 'active' : '' }` }
						>
							<div className="jb-tab__header">
								{ issues > 0 ? (
									<a
										className="jb-navigator-link"
										href={ `/image-size-analysis/${ group }/1` }
										onClick={ e => {
											e.preventDefault();
											recordBoostEvent( 'clicked_isa_report_group', { group } );
											navigate( `/image-size-analysis/${ group }/1` );
										} }
									>
										{ label }
										<span>{ issues }</span>
									</a>
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
	);
};

export default Tabs;
