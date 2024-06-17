import { useState } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import type { IsaCounts } from '$features/image-size-analysis';
import { useNavigate, Link } from 'react-router-dom';
import { getGroupLabel, isaGroupKeys } from '$features/image-size-analysis/lib/isa-groups';
import styles from './tabs.module.scss';
import clsx from 'clsx';

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
				<div className={ styles.dropdown }>
					{ /* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */ }
					<div className={ styles[ 'head-bar' ] } onClick={ onClickDropdown }>
						{ getGroupLabel( activeGroupKey ) }{ ' ' }
						{ currentTab && currentTab.issue_count > 0 && (
							<span className={ styles.issues }>{ currentTab.issue_count }</span>
						) }
						<span className="dashicons dashicons-arrow-down-alt2" />
					</div>

					{ dropdownOpen && (
						<ul className={ styles.options }>
							{ Object.entries( imageDataGroupTabs ).map( ( [ group, details ] ) => (
								// eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
								<li
									key={ group }
									className={ clsx( styles.item, {
										[ styles.active ]: details.issue_count,
										[ styles.selected ]: activeGroupKey === group,
									} ) }
									onClick={ () => details.issue_count > 0 && selectGroup( group ) }
								>
									{ getGroupLabel( group ) }{ ' ' }
									<span className={ styles.issues }>{ details.issue_count }</span>
								</li>
							) ) }
						</ul>
					) }
				</div>

				<div className={ styles.tabs }>
					{ Object.entries( imageDataGroupTabs ).map( ( [ group, details ] ) => {
						const label = getGroupLabel( group );
						const issues = details.issue_count;

						return (
							<div
								key={ group }
								className={ clsx( styles.tab, {
									[ styles.active ]: activeGroupKey === group,
								} ) }
							>
								<div className={ styles.header }>
									{ issues > 0 ? (
										<Link
											className={ styles.link }
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
										<div className={ clsx( styles.link, styles.inactive ) }>
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
