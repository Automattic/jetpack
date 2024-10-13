import { Text, Button, MarkedLines, useBreakpointMatch } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useFixers from '../../hooks/use-fixers';
import useModal from '../../hooks/use-modal';
import DiffViewer from '../diff-viewer';
import PaidAccordion, { PaidAccordionItem } from '../paid-accordion';
import Pagination from './pagination';
import styles from './styles.module.scss';

const ThreatAccordionItem = ( {
	context,
	description,
	diff,
	filename,
	firstDetected,
	fixedIn,
	fixedOn,
	icon,
	fixable,
	id,
	label,
	name,
	source,
	title,
	type,
	severity,
	status,
	hideAutoFixColumn = false,
} ) => {
	const { setModal } = useModal();
	const { recordEvent } = useAnalyticsTracks();

	const { isThreatFixInProgress, isThreatFixStale } = useFixers();
	const isActiveFixInProgress = isThreatFixInProgress( id );
	const isStaleFixInProgress = isThreatFixStale( id );

	const learnMoreButton = source ? (
		<Button variant="link" isExternalLink={ true } weight="regular" href={ source }>
			{ __( 'See more technical details of this threat', 'jetpack-protect' ) }
		</Button>
	) : null;

	const handleIgnoreThreatClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'IGNORE_THREAT',
				props: { id, label, title, icon, severity },
			} );
		};
	};

	const handleUnignoreThreatClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'UNIGNORE_THREAT',
				props: { id, label, title, icon, severity },
			} );
		};
	};

	const handleFixThreatClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'FIX_THREAT',
				props: { id, fixable, label, icon, severity },
			} );
		};
	};

	return (
		<PaidAccordionItem
			id={ id }
			label={ label }
			title={ title }
			icon={ icon }
			fixable={ fixable }
			severity={ severity }
			firstDetected={ firstDetected }
			fixedOn={ fixedOn }
			status={ status }
			onOpen={ useCallback( () => {
				if ( ! [ 'core', 'plugin', 'theme', 'file', 'database' ].includes( type ) ) {
					return;
				}
				recordEvent( `jetpack_protect_${ type }_threat_open` );
			}, [ recordEvent, type ] ) }
			hideAutoFixColumn={ hideAutoFixColumn }
		>
			{ description && (
				<div className={ styles[ 'threat-section' ] }>
					<Text variant="title-small" mb={ 2 }>
						{ status !== 'fixed'
							? __( 'What is the problem?', 'jetpack-protect' )
							: __(
									'What was the problem?',
									'jetpack-protect',
									/** dummy arg to avoid bad minification */ 0
							  ) }
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
					</Text>
					<pre className={ styles[ 'threat-filename' ] }>{ filename }</pre>
				</>
			) }
			{ context && <MarkedLines context={ context } /> }
			{ diff && <DiffViewer diff={ diff } /> }
			{ fixedIn && status !== 'fixed' && (
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
			{ [ 'ignored', 'current' ].includes( status ) && (
				<div className={ styles[ 'threat-footer' ] }>
					{ 'ignored' === status && (
						<Button
							isDestructive={ true }
							variant="secondary"
							onClick={ handleUnignoreThreatClick() }
						>
							{ __( 'Unignore threat', 'jetpack-protect' ) }
						</Button>
					) }
					{ 'current' === status && (
						<>
							<Button
								isDestructive={ true }
								variant="secondary"
								onClick={ handleIgnoreThreatClick() }
								disabled={ isActiveFixInProgress || isStaleFixInProgress }
							>
								{ __( 'Ignore threat', 'jetpack-protect' ) }
							</Button>
							{ fixable && (
								<Button
									disabled={ isActiveFixInProgress || isStaleFixInProgress }
									onClick={ handleFixThreatClick() }
								>
									{ __( 'Fix threat', 'jetpack-protect' ) }
								</Button>
							) }
						</>
					) }
				</div>
			) }
		</PaidAccordionItem>
	);
};

const PaidList = ( { list, hideAutoFixColumn = false } ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	return (
		<>
			{ ! isSmall && (
				<div className={ styles[ 'accordion-header' ] }>
					<span>{ __( 'Details', 'jetpack-protect' ) }</span>
					<span>{ __( 'Severity', 'jetpack-protect' ) }</span>
					{ ! hideAutoFixColumn && <span>{ __( 'Auto-fix', 'jetpack-protect' ) }</span> }
					<span></span>
				</div>
			) }
			<Pagination list={ list }>
				{ ( { currentItems } ) => (
					<PaidAccordion>
						{ currentItems.map(
							( {
								context,
								description,
								diff,
								filename,
								firstDetected,
								fixedIn,
								fixedOn,
								icon,
								fixable,
								id,
								label,
								name,
								severity,
								source,
								table,
								title,
								type,
								version,
								status,
							} ) => (
								<ThreatAccordionItem
									context={ context }
									description={ description }
									diff={ diff }
									filename={ filename }
									firstDetected={ firstDetected }
									fixedIn={ fixedIn }
									fixedOn={ fixedOn }
									icon={ icon }
									fixable={ fixable }
									id={ id }
									key={ id }
									label={ label }
									name={ name }
									severity={ severity }
									source={ source }
									table={ table }
									title={ title }
									type={ type }
									version={ version }
									status={ status }
									hideAutoFixColumn={ hideAutoFixColumn }
								/>
							)
						) }
					</PaidAccordion>
				) }
			</Pagination>
		</>
	);
};

export default PaidList;
