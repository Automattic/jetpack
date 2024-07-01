import { Text, Button, useBreakpointMatch } from '@automattic/jetpack-components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import {
	plugins as pluginsIcon,
	wordpress as coreIcon,
	color as themesIcon,
	code as filesIcon,
	grid as databaseIcon,
} from '@wordpress/icons';
import { useCallback } from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { STORE_ID } from '../../state/store';
import DiffViewer from '../diff-viewer';
import MarkedLines from '../marked-lines';
import PaidAccordion, { PaidAccordionItem } from '../paid-accordion';
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
} ) => {
	const threatsAreFixing = useSelect( select => select( STORE_ID ).getThreatsAreFixing() );
	const { setModal } = useDispatch( STORE_ID );
	const { recordEvent } = useAnalyticsTracks();

	const fixerInProgress = threatsAreFixing.indexOf( id ) >= 0;

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

	const handleFixThreatClick = () => {
		return event => {
			event.preventDefault();
			setModal( {
				type: 'FIX_THREAT',
				props: { id, label, title, icon, severity, fixable },
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
			status={ status }
			firstDetected={ firstDetected }
			fixedOn={ fixedOn }
			onOpen={ useCallback( () => {
				if ( ! [ 'core', 'plugin', 'theme', 'file', 'database' ].includes( type ) ) {
					return;
				}
				recordEvent( `jetpack_protect_${ type }_threat_open` );
			}, [ recordEvent, type ] ) }
		>
			{ description && (
				<div className={ styles[ 'threat-section' ] }>
					<Text variant="title-small" mb={ 2 }>
						{ status === 'fixed' || status === 'ignored'
							? __( 'What was the problem?', 'jetpack-protect' )
							: __( 'What is the problem?', 'jetpack-protect' ) }
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
				{ status !== 'fixed' && status !== 'ignored' && (
					<Button isDestructive={ true } variant="secondary" onClick={ handleIgnoreThreatClick() }>
						{ __( 'Ignore threat', 'jetpack-protect' ) }
					</Button>
				) }
				{ fixable && status !== 'fixed' && status !== 'ignored' && (
					<Button disabled={ fixerInProgress } onClick={ handleFixThreatClick() }>
						{ __( 'Fix threat', 'jetpack-protect' ) }
					</Button>
				) }
			</div>
		</PaidAccordionItem>
	);
};

const PaidList = ( { list } ) => {
	const [ isSmall ] = useBreakpointMatch( [ 'sm', 'lg' ], [ null, '<' ] );

	const getLabel = threat => {
		if ( threat.name && threat.version ) {
			// Extension threat i.e. "Woocommerce (3.0.0)"
			return `${ threat.name } (${ threat.version })`;
		}

		if ( threat.extension && threat.extension.name && threat.extension.version ) {
			// Extension threat i.e. "Woocommerce (3.0.0)"
			return `${ threat.extension.name } (${ threat.extension.version })`;
		}

		if ( threat.filename ) {
			// File threat i.e. "index.php"
			return threat.filename.split( '/' ).pop();
		}

		if ( threat.table ) {
			// Database threat i.e. "wp_posts"
			return threat.table;
		}
	};

	const getIcon = threat => {
		if ( threat.extension && threat.extension.type === 'plugin' ) {
			return pluginsIcon;
		}
		if ( threat.extension && threat.extension.type === 'theme' ) {
			return themesIcon;
		}
		if ( threat.filename ) {
			return filesIcon;
		}
		if ( threat.table ) {
			return databaseIcon;
		}
		return coreIcon;
	};

	list = list.map( threat => ( {
		label: getLabel( threat ),
		icon: getIcon( threat ),
		...threat,
	} ) );

	return (
		<>
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
						context,
						description,
						diff,
						filename,
						firstDetected, // todo: still needs a proper fix
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
						/>
					)
				) }
			</PaidAccordion>
		</>
	);
};

export default PaidList;
