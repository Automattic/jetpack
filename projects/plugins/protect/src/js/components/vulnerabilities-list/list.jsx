/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';
import { plugins as pluginsIcon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import Accordion, { AccordionItem } from '../accordion';
import useProtectData from '../../hooks/use-protect-data';

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

const VulAccordionItem = ( { id, name, version, title, icon, fixedIn } ) => {
	return (
		<AccordionItem id={ id } label={ `${ name } (${ version })` } title={ title } icon={ icon }>
			<Text variant="title-small" mb={ 2 }>
				{ __( 'How to fix it?', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 2 }>
				{
					/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
					sprintf( __( 'Update to %1$s %2$s', 'jetpack-protect' ), name, fixedIn )
				}
			</Text>
			<Button
				variant="external-link"
				href={ getRedirectUrl( 'jetpack-protect-vul-info', { path: id } ) }
			>
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
					vulnerabilities.map( ( { title, id, fixedIn } ) => (
						<VulAccordionItem
							key={ id }
							id={ id }
							name={ name }
							version={ version }
							title={ title }
							icon={ pluginsIcon }
							fixedIn={ fixedIn }
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

const List = ( { selected } ) => {
	return (
		<Accordion>
			{ selected === 'all' ? <AllVuls /> : <SelectedVuls selected={ selected } /> }
		</Accordion>
	);
};

export default List;
