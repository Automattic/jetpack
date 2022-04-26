/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';
import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Accordion, { AccordionItem } from '../accordion';

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

const List = ( { list } ) => {
	return (
		<Accordion>
			{ list.map( ( { id, name, title, version, fixedIn, icon } ) => (
				<VulAccordionItem
					key={ id }
					id={ id }
					name={ name }
					version={ version }
					title={ title }
					icon={ icon }
					fixedIn={ fixedIn }
				/>
			) ) }
		</Accordion>
	);
};

export default List;
