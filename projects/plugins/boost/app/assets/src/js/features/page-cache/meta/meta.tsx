import { Button, IconTooltip, Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import Lightning from '$svg/lightning';
import styles from './meta.module.scss';
import { useEffect, useState } from 'react';
import { usePageCache, useClearPageCacheAction } from '$lib/stores/page-cache';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { useMutationNotice } from '$features/ui';
import { useDataSyncSubset } from '@automattic/jetpack-react-data-sync-client';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';
import { recordBoostEvent } from '$lib/utils/analytics';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const pageCache = usePageCache();

	const [ logging, mutateLogging ] = useDataSyncSubset( pageCache, 'logging' );
	const [ bypassPatterns, mutateBypassPatterns ] = useDataSyncSubset(
		pageCache,
		'bypass_patterns'
	);
	const [ clearedCacheMessage, runClearPageCacheAction ] = useClearPageCacheAction();

	const clearPageCache = () => {
		runClearPageCacheAction.mutate();
	};

	const totalBypassPatterns = bypassPatterns?.length || 0;

	const getSummary = () => {
		if ( runClearPageCacheAction.isPending ) {
			return __( 'Clearing cache…', 'jetpack-boost' );
		}

		if ( totalBypassPatterns === 0 && ! logging ) {
			return __( 'No exceptions or logging.', 'jetpack-boost' );
		}

		return (
			<>
				{ totalBypassPatterns > 0 ? (
					<>
						{ sprintf(
							/* translators: %d is the number of cache bypass patterns. */
							_n( '%d exception.', '%d exceptions.', totalBypassPatterns, 'jetpack-boost' ),
							totalBypassPatterns
						) }
					</>
				) : (
					__( 'No exceptions.', 'jetpack-boost' )
				) }{ ' ' }
				{ logging && __( 'Logging activated.', 'jetpack-boost' ) }
				{ ! logging && __( 'No logging.', 'jetpack-boost' ) }
			</>
		);
	};

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue.split( '\n' ).map( line => line.trim() );

		recordBoostEvent( 'page_cache_bypass_patterns', {
			total: newPatterns.length,
		} );
		mutateBypassPatterns.mutate( newPatterns );
	};

	const toggleLogging = ( event: React.ChangeEvent< HTMLInputElement > ) => {
		recordBoostEvent( 'page_cache_toggle_logging', {} );
		mutateLogging.mutate( event.target.checked );
	};

	const loggingEnabledMessage = __( 'Logging enabled.', 'jetpack-boost' );
	const loggingDisabledMessage = __( 'Logging disabled.', 'jetpack-boost' );
	useMutationNotice( 'update-bypass-patterns', mutateBypassPatterns );
	useMutationNotice( 'update-logging', mutateLogging, {
		successMessage: logging ? loggingEnabledMessage : loggingDisabledMessage,
	} );

	useMutationNotice( 'clear-page-cache', runClearPageCacheAction, {
		savingMessage: __( 'Clearing cache…', 'jetpack-boost' ),
		errorMessage: __( 'Unable to clear cache.', 'jetpack-boost' ),
		successMessage: clearedCacheMessage || __( 'Cache cleared.', 'jetpack-boost' ),
	} );

	return (
		pageCache && (
			<div className={ styles.wrapper } data-testid="page-cache-meta">
				<div className={ styles.head }>
					<div className={ styles.summary }>{ getSummary() }</div>
					<div className={ styles.actions }>
						<Button
							variant="link"
							size="small"
							weight="regular"
							iconSize={ 16 }
							icon={ <Lightning /> }
							onClick={ clearPageCache }
							disabled={ runClearPageCacheAction.isPending }
						>
							{ __( 'Clear Cache', 'jetpack-boost' ) }
						</Button>{ ' ' }
						<Button
							variant="link"
							size="small"
							weight="regular"
							iconSize={ 16 }
							icon={ isExpanded ? <ChevronUp /> : <ChevronDown /> }
							onClick={ () => setIsExpanded( ! isExpanded ) }
						>
							{ __( 'Show Options', 'jetpack-boost' ) }
						</Button>
					</div>
				</div>
				{ isExpanded && (
					<div className={ styles.body }>
						<>
							<BypassPatterns
								patterns={ bypassPatterns.join( '\n' ) }
								setPatterns={ updatePatterns }
								showErrorNotice={ mutateBypassPatterns.isError }
							/>
							<div className={ styles.section }>
								<div className={ styles.title }>{ __( 'Logging', 'jetpack-boost' ) }</div>
								<label htmlFor="cache-logging" className={ styles[ 'logging-toggle' ] }>
									<input
										type="checkbox"
										id="cache-logging"
										checked={ logging }
										onChange={ toggleLogging }
									/>{ ' ' }
									{ __( 'Activate logging to track all your cache events.', 'jetpack-boost' ) }
								</label>
								{ logging && (
									<Link className={ styles[ 'see-logs-link' ] } to="/cache-debug-log">
										{ __( 'See Logs', 'jetpack-boost' ) }
									</Link>
								) }
								<div className={ styles.clearfix } />
							</div>
						</>
					</div>
				) }
			</div>
		)
	);
};

type BypassPatternsProps = {
	patterns: string;
	setPatterns: ( newValue: string ) => void;
	showErrorNotice: boolean;
};

const BypassPatterns = ( {
	patterns,
	setPatterns,
	showErrorNotice = false,
}: BypassPatternsProps ) => {
	const [ inputValue, setInputValue ] = useState( patterns );
	const [ showNotice, setShowNotice ] = useState( showErrorNotice );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ inputInvalid, setInputInvalid ] = useState( false );

	const exclusionsLink = getRedirectUrl( 'jetpack-boost-cache-how-to-exclude' );

	const validateInputValue = ( value: string ) => {
		setInputValue( value );
		setInputInvalid( ! validatePatterns( value ) );
	};

	const validatePatterns = ( value: string ) => {
		const lines = value
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line.trim() !== '' );

		// check if it's a valid regex
		try {
			lines.forEach( line => new RegExp( line ) );
		} catch ( e ) {
			return false;
		}

		return true;
	};

	useEffect( () => {
		setInputValue( patterns );
	}, [ patterns ] );

	useEffect( () => {
		setShowNotice( showErrorNotice );
	}, [ showErrorNotice ] );

	function save() {
		setPatterns( inputValue );
	}

	return (
		<div
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
			<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
			<label htmlFor="jb-cache-exceptions">
				{ __( 'URLs of pages and posts that will never be cached:', 'jetpack-boost' ) }
			</label>
			<textarea
				value={ inputValue }
				rows={ 3 }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-cache-exceptions"
			/>
			<p className={ clsx( styles.description, styles[ 'error-message' ] ) }>
				{ __( 'Error: Invalid format', 'jetpack-boost' ) }
			</p>
			<div className={ styles.description }>
				{ __(
					'Use (.*) to address multiple URLs under a given path. Be sure each URL path is in its own line.',
					'jetpack-boost'
				) }
				<br />
				{ createInterpolateElement(
					__( '<help>See an example</help> or <link>learn more</link>.', 'jetpack-boost' ),
					{
						help: <BypassPatternsExample />, // children are passed after the interpolation.
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						link: <a href={ exclusionsLink } target="_blank" rel="noreferrer" />,
					}
				) }
			</div>
			{ showNotice && (
				<Notice
					level="error"
					title={ __( 'Error: Unable to save changes.', 'jetpack-boost' ) }
					onClose={ () => setShowNotice( false ) }
				>
					{ __( 'An error occurred while saving changes. Please, try again.', 'jetpack-boost' ) }
				</Notice>
			) }
			<Button
				disabled={ patterns === inputValue || inputInvalid }
				onClick={ save }
				className={ styles.button }
			>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

type BypassPatternsExampleProps = {
	children?: React.ReactNode;
};

const BypassPatternsExample = ( { children }: BypassPatternsExampleProps ) => {
	const [ show, setShow ] = useState( false );

	return (
		<div className={ styles[ 'example-wrapper' ] }>
			{ /* eslint-disable-next-line jsx-a11y/anchor-is-valid */ }
			<a
				href="#"
				className={ styles[ 'example-button' ] }
				onClick={ e => {
					e.preventDefault();
					setShow( ! show );
				} }
			>
				{ children }
			</a>
			<div className={ styles[ 'tooltip-wrapper' ] }>
				<IconTooltip
					placement="bottom-start"
					popoverAnchorStyle="wrapper"
					forceShow={ show }
					offset={ -10 }
					className={ styles.tooltip }
				>
					<strong>{ __( 'Example:', 'jetpack-boost' ) }</strong>
					<br />
					checkout
					<br />
					gallery/.*
					<br />
					specific-page
				</IconTooltip>
			</div>
		</div>
	);
};

export default () => {
	return (
		<ErrorBoundary
			fallback={
				<ErrorNotice
					title={ __( 'Error', 'jetpack-boost' ) }
					error={ new Error( __( 'Unable to load Cache settings.', 'jetpack-boost' ) ) }
				/>
			}
		>
			<Meta />
		</ErrorBoundary>
	);
};
