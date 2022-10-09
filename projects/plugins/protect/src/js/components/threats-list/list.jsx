import { Text, Button, ContextualUpgradeTrigger } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import Accordion, { AccordionItem } from '../accordion';
import { SECURITY_BUNDLE } from '../admin-page';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( {
	id,
	name,
	version,
	title,
	description,
	icon,
	fixedIn,
	type,
	source,
} ) => {
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run } = useProductCheckoutWorkflow( {
		productSlug: SECURITY_BUNDLE,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getSecurityBundle = recordEventHandler(
		'jetpack_protect_vulnerability_list_get_security_link_click',
		run
	);

	const learnMoreButton = source ? (
		<Button variant="link" isExternalLink={ true } weight="regular" href={ source }>
			{ __( 'See more technical details of this threat', 'jetpack-protect' ) }
		</Button>
	) : null;

	return (
		<AccordionItem
			id={ id }
			label={ `${ name } (${ version })` }
			title={ title }
			icon={ icon }
			onOpen={ useCallback( () => {
				if ( ! [ 'core', 'plugin', 'theme' ].includes( type ) ) {
					return;
				}
				recordEventHandler( `jetpack_protect_${ type }_vulnerability_open` );
			}, [ recordEventHandler, type ] ) }
		>
			{ description && (
				<div className={ styles[ 'threat-section' ] }>
					<Text variant="title-small" mb={ 2 }>
						{ __( 'What is the problem?', 'jetpack-protect' ) }
					</Text>
					<Text mb={ 2 }>{ description }</Text>
					{ learnMoreButton }
				</div>
			) }
			{ fixedIn && (
				<div className={ styles[ 'threat-section' ] }>
					<Text variant="title-small" mb={ 2 }>
						{ __( 'How to fix it?', 'jetpack-protect' ) }
					</Text>
					<Text mb={ 2 }>
						{
							/* translators: Translates to Update to. %1$s: Name. %2$s: Fixed version */
							sprintf( __( 'Update to %1$s %2$s', 'jetpack-protect' ), name, fixedIn )
						}
					</Text>
					<ContextualUpgradeTrigger
						description={ __(
							'Looking for advanced scan results and one-click fixes?',
							'jetpack-protect'
						) }
						cta={ __( 'Upgrade Jetpack Protect now', 'jetpack-protect' ) }
						onClick={ getSecurityBundle }
						className={ styles[ 'threat-item-cta' ] }
					/>
				</div>
			) }
			{ ! description && <div className={ styles[ 'threat-section' ] }>{ learnMoreButton }</div> }
		</AccordionItem>
	);
};

const List = ( { list } ) => {
	return (
		<Accordion>
			{ list.map( ( { id, name, title, description, version, fixedIn, icon, type, source } ) => (
				<ThreatAccordionItem
					key={ id }
					id={ id }
					name={ name }
					version={ version }
					title={ title }
					description={ description }
					icon={ icon }
					fixedIn={ fixedIn }
					type={ type }
					source={ source }
				/>
			) ) }
		</Accordion>
	);
};

export default List;
