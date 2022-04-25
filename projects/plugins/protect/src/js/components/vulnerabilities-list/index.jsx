/**
 * External dependencies
 */
import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';
import { Container, Col, Text, Button } from '@automattic/jetpack-components';
import { plugins as pluginsIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Accordion, { AccordionItem } from '../accordion';
import useProtectData from '../../hooks/use-protect-data';
import VulnerabilitiesNavigation from './navigation';

const getSelected = ( { core, plugins, themes, selected } ) => {
	if ( selected === 'wordpress' ) {
		return core;
	}

	const fromPlugin = plugins.find( ( { name } ) => name === selected );

	if ( fromPlugin ) {
		return fromPlugin;
	}

	const fromThemes = themes.find( ( { name } ) => name === selected );
	if ( fromThemes ) {
		return fromThemes;
	}
};

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

const AllVuls = () => {
	const { plugins, themes } = useProtectData();
	return (
		<>
			{ [ ...plugins, ...themes ]
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
				.flat() }
		</>
	);
};

const SelectedVuls = ( { selected } ) => {
	const { plugins, themes, core } = useProtectData();
	const selectedItem = getSelected( { core, plugins, themes, selected } );
	const vuls = selectedItem?.vulnerabilities;
	return vuls.map( ( { title, id } ) => (
		<VulAccordionItem
			key={ id }
			id={ `${ id }-${ title }` }
			name={ selectedItem?.name }
			version={ selectedItem?.version }
			title={ title }
			icon={ pluginsIcon }
		/>
	) );
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
					{ selected === 'all' ? <AllVuls /> : <SelectedVuls selected={ selected } /> }
				</Accordion>
			</Col>
		</Container>
	);
};

export default VulnerabilitiesList;
