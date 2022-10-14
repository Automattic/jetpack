import { Text, Button, ContextualUpgradeTrigger } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { JETPACK_SCAN } from '../admin-page';
import FreeAccordion, { FreeAccordionItem } from '../free-accordion';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( {
	description,
	filename,
	fixedIn,
	icon,
	id,
	name,
	source,
	table,
	title,
	type,
	version,
} ) => {
	const { adminUrl } = window.jetpackProtectInitialState || {};
	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_threat_list_get_scan_link_click', run );

	const learnMoreButton = source ? (
		<Button variant="link" isExternalLink={ true } weight="regular" href={ source }>
			{ __( 'See more technical details of this threat', 'jetpack-protect' ) }
		</Button>
	) : null;

	/**
	 * Get Label
	 *
	 * @returns {string} Threat label based on the assumed threat type (extension, file, database, etc).
	 */
	const getLabel = useCallback( () => {
		if ( name && version ) {
			// Extension threat i.e. "Woocommerce (3.0.0)"
			return `${ name } (${ version })`;
		}

		if ( filename ) {
			// File threat i.e. "index.php"
			return filename.split( '/' ).pop();
		}

		if ( table ) {
			// Database threat i.e. "wp_posts"
			return table;
		}
	}, [ filename, name, table, version ] );

	return (
		<FreeAccordionItem
			id={ id }
			label={ getLabel() }
			title={ title }
			icon={ icon }
			onOpen={ useCallback( () => {
				if ( ! [ 'core', 'plugin', 'theme' ].includes( type ) ) {
					return;
				}
				recordEventHandler( `jetpack_protect_${ type }_threat_open` );
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
						onClick={ getScan }
						className={ styles[ 'threat-item-cta' ] }
					/>
				</div>
			) }
			{ ! description && <div className={ styles[ 'threat-section' ] }>{ learnMoreButton }</div> }
		</FreeAccordionItem>
	);
};

const FreeList = ( { list } ) => {
	return (
		<FreeAccordion>
			{ list.map(
				( { description, fixedIn, icon, id, name, source, table, title, type, version } ) => (
					<ThreatAccordionItem
						description={ description }
						fixedIn={ fixedIn }
						icon={ icon }
						id={ id }
						key={ id }
						name={ name }
						source={ source }
						table={ table }
						title={ title }
						type={ type }
						version={ version }
					/>
				)
			) }
		</FreeAccordion>
	);
};

export default FreeList;
