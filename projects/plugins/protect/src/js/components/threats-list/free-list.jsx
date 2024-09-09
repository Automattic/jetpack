import { Text, Button, ContextualUpgradeTrigger } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import FreeAccordion, { FreeAccordionItem } from '../free-accordion';
import Pagination from './pagination';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( {
	description,
	fixedIn,
	icon,
	id,
	label,
	name,
	source,
	title,
	type,
} ) => {
	const { recordEvent } = useAnalyticsTracks();
	const { upgradePlan } = usePlan();

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_threat_list_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	const learnMoreButton = source ? (
		<Button variant="link" isExternalLink={ true } weight="regular" href={ source }>
			{ __( 'See more technical details of this threat', 'jetpack-protect' ) }
		</Button>
	) : null;

	return (
		<FreeAccordionItem
			id={ id }
			label={ label }
			title={ title }
			icon={ icon }
			onOpen={ useCallback( () => {
				if ( ! [ 'core', 'plugin', 'theme' ].includes( type ) ) {
					return;
				}
				recordEvent( `jetpack_protect_${ type }_threat_open` );
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
		<Pagination list={ list }>
			{ ( { currentItems } ) => (
				<FreeAccordion>
					{ currentItems.map(
						( {
							description,
							fixedIn,
							icon,
							id,
							label,
							name,
							source,
							table,
							title,
							type,
							version,
						} ) => (
							<ThreatAccordionItem
								description={ description }
								fixedIn={ fixedIn }
								icon={ icon }
								id={ id }
								label={ label }
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
			) }
		</Pagination>
	);
};

export default FreeList;
