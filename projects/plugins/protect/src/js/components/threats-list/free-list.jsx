import { Text, Button, getRedirectUrl } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import FreeAccordion, { FreeAccordionItem } from '../free-accordion';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( { id, name, version, title, description, icon, fixedIn, type } ) => {
	const { recordEvent } = useAnalyticsTracks();

	const learnMoreButton = (
		<Button
			variant="link"
			isExternalLink={ true }
			weight="regular"
			href={ getRedirectUrl( 'jetpack-protect-vul-info', { path: id } ) }
		>
			{ __( 'See more technical details of this vulnerability', 'jetpack-protect' ) }
		</Button>
	);

	return (
		<FreeAccordionItem
			id={ id }
			label={ `${ name } (${ version })` }
			title={ title }
			icon={ icon }
			onOpen={ useCallback( () => {
				if ( ! [ 'core', 'plugin', 'theme' ].includes( type ) ) {
					return;
				}
				recordEvent( `jetpack_protect_${ type }_vulnerability_open` );
			}, [ recordEvent, type ] ) }
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
				</div>
			) }
			{ ! description && <div className={ styles[ 'threat-section' ] }>{ learnMoreButton }</div> }
		</FreeAccordionItem>
	);
};

const FreeList = ( { list } ) => {
	return (
		<FreeAccordion>
			{ list.map( ( { id, name, title, description, version, fixedIn, icon, type } ) => (
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
				/>
			) ) }
		</FreeAccordion>
	);
};

export default FreeList;
