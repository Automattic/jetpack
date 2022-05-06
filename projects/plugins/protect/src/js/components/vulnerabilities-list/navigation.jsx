/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { wordpress, plugins as pluginsIcon, warning, color } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Navigation, { NavigationItem, NavigationGroup } from '../navigation';
import useProtectData from '../../hooks/use-protect-data';

const VulnerabilitiesNavigation = ( { selected, onSelect } ) => {
	const { plugins, themes, numVulnerabilities, numCoreVulnerabilities } = useProtectData();
	return (
		<Navigation selected={ selected } onSelect={ onSelect }>
			<NavigationItem
				initial
				id="all"
				label={ __( 'All vulnerabilities', 'jetpack-protect' ) }
				icon={ warning }
				badge={ numVulnerabilities }
				disabled={ numVulnerabilities <= 0 }
			/>
			<NavigationItem
				id="wordpress"
				label={ __( 'WordPress', 'jetpack-protect' ) }
				icon={ wordpress }
				badge={ numCoreVulnerabilities }
				disabled={ numCoreVulnerabilities <= 0 }
			/>
			<NavigationGroup label={ __( 'Plugins', 'jetpack-protect' ) } icon={ pluginsIcon }>
				{ plugins.map( ( { name, vulnerabilities, notChecked } ) => (
					<NavigationItem
						key={ name }
						id={ name }
						label={ name }
						notChecked={ notChecked }
						badge={ vulnerabilities?.length }
						disabled={ vulnerabilities?.length <= 0 }
					/>
				) ) }
			</NavigationGroup>
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ color }>
				{ themes.map( ( { name, vulnerabilities, notChecked } ) => (
					<NavigationItem
						key={ name }
						id={ name }
						label={ name }
						notChecked={ notChecked }
						badge={ vulnerabilities?.length }
						disabled={ vulnerabilities?.length <= 0 }
					/>
				) ) }
			</NavigationGroup>
		</Navigation>
	);
};

export default VulnerabilitiesNavigation;
