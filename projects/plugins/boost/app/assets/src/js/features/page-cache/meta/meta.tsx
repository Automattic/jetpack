import { Button, IconTooltip, Notice, getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
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
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import { ExternalLink } from '@wordpress/components';

const Meta = () => {
	const pageCache = usePageCache();

	const [ logging, mutateLogging ] = useDataSyncSubset( pageCache, 'logging' );
	const [ bypassPatterns, mutateBypassPatterns ] = useDataSyncSubset(
		pageCache,
		'bypass_patterns'
	);
	const [ clearedCacheMessage, runClearPageCacheAction ] = useClearPageCacheAction();

	const clearPageCache = () => {
		recordBoostEvent( 'page_cache_clear_clicked', {} );
		runClearPageCacheAction.mutate();
	};

	const handleSeeLogsClick = () => {
		recordBoostEvent( 'page_cache_see_logs_clicked', {} );
	};

	const totalBypassPatterns = bypassPatterns?.length || 0;

	const getSummary = () => {
		if ( runClearPageCacheAction.isPending ) {
			return __( 'Clearing cache…', 'jetpack-boost' );
		}

		if ( totalBypassPatterns === 0 && ! logging ) {
			return __( 'No exceptions.', 'jetpack-boost' ) + ' ' + __( 'No logging.', 'jetpack-boost' );
		}

		let loggingMessage;
		if ( logging ) {
			loggingMessage = __( 'Logging activated.', 'jetpack-boost' );
		}

		if ( ! logging ) {
			loggingMessage = __( 'No logging.', 'jetpack-boost' );
		}

		return (
			( totalBypassPatterns > 0
				? sprintf(
						/* translators: %d is the number of cache bypass patterns. */
						_n( '%d exception.', '%d exceptions.', totalBypassPatterns, 'jetpack-boost' ),
						totalBypassPatterns
				  )
				: __( 'No exceptions.', 'jetpack-boost' ) ) +
			' ' +
			loggingMessage
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

	const extraButtons = (
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
		</Button>
	);

	const content = (
		<div className={ styles.body }>
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
					<Link
						onClick={ handleSeeLogsClick }
						className={ styles[ 'see-logs-link' ] }
						to="/cache-debug-log"
					>
						{ __( 'See Logs', 'jetpack-boost' ) }
					</Link>
				) }
				<div className={ styles.clearfix } />
			</div>
		</div>
	);

	return (
		pageCache && (
			<div className={ styles.wrapper } data-testid="page-cache-meta">
				<CollapsibleMeta
					headerText={ getSummary() }
					extraButtons={ extraButtons }
					toggleText={ __( 'Show Options', 'jetpack-boost' ) }
					tracksEvent={ 'page_cache_exceptions_panel_toggle' }
				>
					{ content }
				</CollapsibleMeta>
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
		} catch {
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
		recordBoostEvent( 'page_cache_exceptions_save_clicked', {} );
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
						link: <ExternalLink href={ exclusionsLink } />,
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
					recordBoostEvent( 'page_cache_see_example_clicked', {} );
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
			fallback={ _error => (
				<ErrorNotice
					title={ __( 'Error', 'jetpack-boost' ) }
					error={ new Error( __( 'Unable to load Cache settings.', 'jetpack-boost' ) ) }
				/>
			) }
		>
			<Meta />
		</ErrorBoundary>
	);
};
