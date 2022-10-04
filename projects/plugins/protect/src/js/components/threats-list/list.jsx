import { Text, Button } from '@automattic/jetpack-components';
import { useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import { STORE_ID } from '../../state/store';
import Accordion, { AccordionItem } from '../accordion';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( {
	context,
	description,
	diff,
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
	severity,
} ) => {
	const { recordEvent } = useAnalyticsTracks();
	const { setModal } = useDispatch( STORE_ID );

	const { securityBundle } = useProtectData();
	const { hasRequiredPlan } = securityBundle;

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

	const handleIgnoreThreatClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'IGNORE_THREAT',
				props: { id, label: getLabel(), title, icon, severity },
			} );
		};
	};

	return (
		<AccordionItem
			id={ id }
			label={ getLabel() }
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
			{ ( filename || context || diff ) && (
				<Text variant="title-small" mb={ 2 }>
					{ __( 'The technical details', 'jetpack-protect' ) }
				</Text>
			) }
			{ filename && (
				<>
					<Text mb={ 2 }>
						{
							/* translators: filename follows in separate line; e.g. "PHP.Injection.5 in: `post.php`" */
							__( 'Threat found in file:', 'jetpack-protect' )
						}
						<pre className={ styles[ 'threat-filename' ] }>{ filename }</pre>
					</Text>
				</>
			) }
			{ context && <MarkedLines context={ context } /> }
			{ diff && <DiffViewer diff={ diff } /> }
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
			{ hasRequiredPlan && (
				<div className={ styles[ 'threat-footer' ] }>
					<Button isDestructive={ true } variant="secondary" onClick={ handleIgnoreThreatClick() }>
						{ __( 'Ignore threat', 'jetpack-protect' ) }
					</Button>
				</div>
			) }
		</AccordionItem>
	);
};

const List = ( { list } ) => {
	return (
		<Accordion>
			{ list.map(
				( {
					context,
					description,
					diff,
					filename,
					fixedIn,
					icon,
					id,
					name,
					severity,
					source,
					table,
					title,
					type,
					version,
				} ) => (
					<ThreatAccordionItem
						context={ context }
						description={ description }
						diff={ diff }
						filename={ filename }
						fixedIn={ fixedIn }
						icon={ icon }
						id={ id }
						key={ id }
						name={ name }
						severity={ severity }
						source={ source }
						table={ table }
						title={ title }
						type={ type }
						version={ version }
					/>
				)
			) }
		</Accordion>
	);
};

export default List;
