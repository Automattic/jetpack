/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Container, Col, Text } from '@automattic/jetpack-components';
import { wordpress, plugins as pluginsIcon, warning, color } from '@wordpress/icons';

/**
 * Internal dependencies
 */
// import styles from './styles.module.scss';
import Navigation, { NavigationItem, NavigationGroup } from '../navigation';
import Accordion, { AccordionItem } from '../accordion';
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
				{ plugins.map( ( { name, vulnerabilities } ) => (
					<NavigationItem
						id={ name }
						label={ name }
						badge={ vulnerabilities?.length }
						disabled={ vulnerabilities?.length <= 0 }
					/>
				) ) }
			</NavigationGroup>
			<NavigationGroup label={ __( 'Themes', 'jetpack-protect' ) } icon={ color }>
				{ themes.map( ( { name, vulnerabilities } ) => (
					<NavigationItem
						id={ name }
						label={ name }
						badge={ vulnerabilities?.length }
						disabled={ vulnerabilities?.length <= 0 }
					/>
				) ) }
			</NavigationGroup>
		</Navigation>
	);
};

const VulnerabilitiesList = () => {
	const [ selected, setSelected ] = useState( 'all' );

	return (
		<Container fluid>
			<Col lg={ 4 }>
				<VulnerabilitiesNavigation selected={ selected } onSelect={ setSelected } />
			</Col>
			<Col lg={ 8 }>
				<Accordion>
					<AccordionItem
						id="wordpress"
						label="WordPress (5.9-5.9.1)"
						title="Contributor+ Stored Cross-Site Scripting"
						icon={ wordpress }
					>
						<Text variant="title-small" mb={ 2 }>
							What is the problem?
						</Text>
						<Text mb={ 5 }>
							Post authors are able to bypass KSES restrictions in WordPress { '>' }= 5.9 (and or
							Gutenberg { '>' }= 9.8.0) due to the order filters are executed, which could allow
							them to perform to Stored Cross-Site Scripting attacks
						</Text>
						<Text variant="title-small" mb={ 2 }>
							How to fix it?
						</Text>
						<Text>Update to WordPress 5.9.2</Text>
					</AccordionItem>
				</Accordion>
			</Col>
		</Container>
	);
};

export default VulnerabilitiesList;
