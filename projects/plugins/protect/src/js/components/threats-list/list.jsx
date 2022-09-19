import { Text, Button } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import Accordion, { AccordionItem } from '../accordion';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
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
	filename,
	diff,
	context,
	table,
} ) => {
	const { recordEvent } = useAnalyticsTracks();

	const learnMoreButton = source ? (
		<Button variant="link" isExternalLink={ true } weight="regular" href={ source }>
			{ __( 'See more technical details of this threat', 'jetpack-protect' ) }
		</Button>
	) : null;

	const getLabel = useCallback( () => {
		if ( name && version ) {
			return `${ name } (${ version })`;
		}

		if ( filename ) {
			return filename.split( '/' ).pop();
		}

		if ( table ) {
			return table;
		}
	}, [ filename, name, version, table ] );

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
			{ filename && (
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
		</AccordionItem>
	);
};

const List = ( { list } ) => {
	return (
		<Accordion>
			{ list.map(
				( {
					id,
					name,
					title,
					description,
					version,
					fixedIn,
					icon,
					type,
					source,
					filename,
					diff,
					context,
					table,
				} ) => (
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
						filename={ filename }
						diff={ diff }
						context={ context }
						table={ table }
					/>
				)
			) }
		</Accordion>
	);
};

export default List;
