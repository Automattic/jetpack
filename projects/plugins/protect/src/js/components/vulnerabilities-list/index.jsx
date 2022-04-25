/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Container, Col, Text, Button } from '@automattic/jetpack-components';
import { plugins as pluginsIcon, color } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Accordion, { AccordionItem } from '../accordion';
import useProtectData from '../../hooks/use-protect-data';
import VulnerabilitiesNavigation from './navigation';

const VulAccordionItem = ( { id, name, version, title, icon } ) => {
	return (
		<AccordionItem id={ id } label={ `${ name } (${ version })` } title={ title } icon={ icon }>
			<Text variant="title-small" mb={ 2 }>
				{ __( 'How to fix it?', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 2 }>Update to WordPress 5.9.2</Text>
			<Button variant="external-link">
				{ __( 'See more technical details of this vulnerability', 'jetpack-protect' ) }
			</Button>
		</AccordionItem>
	);
};

const AllPluginsVuls = () => {
	const { plugins } = useProtectData();
	return plugins
		.map( ( { name, version, vulnerabilities } ) =>
			vulnerabilities.map( ( { title, id } ) => (
				<VulAccordionItem
					key={ id }
					id={ `${ id }-${ title }` }
					name={ name }
					version={ version }
					title={ title }
					icon={ pluginsIcon }
				/>
			) )
		)
		.flat();
};

const AllThemesVuls = () => {
	const { themes } = useProtectData();
	return themes
		.map( ( { name, version, vulnerabilities } ) =>
			vulnerabilities.map( ( { title, id } ) => (
				<VulAccordionItem
					key={ id }
					id={ id }
					name={ name }
					version={ version }
					title={ title }
					icon={ color }
				/>
			) )
		)
		.flat();
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
					{ selected === 'all' && (
						<>
							<AllPluginsVuls />
							<AllThemesVuls />
						</>
					) }
				</Accordion>
			</Col>
		</Container>
	);
};

export default VulnerabilitiesList;
