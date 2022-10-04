import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import PaidAccordion, { PaidAccordionItem } from '../paid-accordion';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( {
	id,
	name,
	version,
	title,
	description,
	icon,
	fixable,
	fixedIn,
	severity,
	type,
	source,
} ) => {
	const { recordEvent } = useAnalyticsTracks();

	const learnMoreButton = source ? (
		<Button variant="link" isExternalLink={ true } weight="regular" href={ source }>
			{ __( 'See more technical details of this vulnerability', 'jetpack-protect' ) }
		</Button>
	) : null;

	return (
		<PaidAccordionItem
			id={ id }
			label={ `${ name } (${ version })` }
			title={ title }
			icon={ icon }
			fixable={ fixable }
			severity={ severity }
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
			<div className={ styles[ 'threat-footer' ] }>
				<Button isDestructive={ true } variant="secondary">
					{ __( 'Ignore threat', 'jetpack-protect' ) }
				</Button>
				{ fixable && <Button>{ __( 'Fix threat', 'jetpack-protect' ) }</Button> }
			</div>
		</PaidAccordionItem>
	);
};

const manualScan = createInterpolateElement(
	__(
		'If you have manually fixed any of the threats listed above, <manualScanLink>you can run a manual scan now</manualScanLink> or wait for Jetpack to scan your site later today.',
		'jetpack-protect'
	),
	{
		manualScanLink: <a href="#" />,
	}
);

const PaidList = ( { list } ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );
	const fixableCount = list.filter( obj => obj.fixable ).length;

	return (
		<>
			<div className={ styles[ 'threat-header' ] }>
				{ fixableCount > 0 && (
					<Button variant="primary">
						{
							/* translators: Translates to Auto fix all. $s: Number of fixable threats. */
							sprintf( __( 'Auto fix all (%s)', 'jetpack-protect' ), fixableCount )
						}
					</Button>
				) }
				<Button variant="secondary">{ __( 'Scan now', 'jetpack-protect' ) }</Button>
			</div>
			{ ! isSmall && (
				<div className={ styles[ 'accordion-heading' ] }>
					<span>{ __( 'Details', 'jetpack-protect' ) }</span>
					<span>{ __( 'Severity', 'jetpack-protect' ) }</span>
					<span>{ __( 'Auto-fix', 'jetpack-protect' ) }</span>
					<span></span>
				</div>
			) }
			<PaidAccordion>
				{ list.map(
					( {
						id,
						name,
						version,
						title,
						description,
						icon,
						fixedIn,
						fixable,
						severity,
						type,
						source,
					} ) => (
						<ThreatAccordionItem
							key={ id }
							id={ id }
							name={ name }
							version={ version }
							title={ title }
							description={ description }
							icon={ icon }
							fixable={ fixable }
							fixedIn={ fixedIn }
							severity={ severity }
							type={ type }
							source={ source }
						/>
					)
				) }
			</PaidAccordion>
			<Text className={ styles[ 'manual-scan' ] } variant="body-small">
				{ manualScan }
			</Text>
		</>
	);
};

export default PaidList;
