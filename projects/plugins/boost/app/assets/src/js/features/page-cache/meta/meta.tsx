import { IconTooltip, getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Stack, Link as WPLink } from '@wordpress/ui';
import styles from './meta.module.scss';
import modernStyles from './modern-meta.module.scss';
import { useEffect, useRef, useState } from 'react';
import { usePageCache, useClearPageCacheAction } from '$lib/stores/page-cache';
import clsx from 'clsx';
import { useMutationNotice } from '$features/ui';
import SaveButton from '$features/ui/save-button/save-button';
import { useDataSyncSubset } from '@automattic/jetpack-react-data-sync-client';
import { useTooltipLayer } from '$features/module/surface';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import { recordBoostEvent } from '$lib/utils/analytics';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import type { ReactNode, RefObject } from 'react';

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
		window.scrollTo( 0, 0 );
	};

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue.split( '\n' ).map( line => line.trim() );

		recordBoostEvent( 'page_cache_bypass_patterns', {
			total: newPatterns.length,
		} );
		mutateBypassPatterns.mutate( newPatterns );
	};

	const setLogging = ( value: boolean ) => {
		recordBoostEvent( 'page_cache_toggle_logging', {} );
		mutateLogging.mutate( value );
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

	const exceptions = (
		<BypassPatterns
			patterns={ bypassPatterns.join( '\n' ) }
			setPatterns={ updatePatterns }
			showErrorNotice={ mutateBypassPatterns.isError }
		/>
	);

	if ( ! pageCache ) {
		return null;
	}

	return (
		<div className={ styles.wrapper } data-testid="page-cache-meta">
			<div className={ modernStyles[ 'clear-cache' ] }>
				<Button
					variant="outline"
					size="compact"
					onClick={ clearPageCache }
					disabled={ runClearPageCacheAction.isPending }
					loading={ runClearPageCacheAction.isPending }
					loadingAnnouncement={ __( 'Clearing cache…', 'jetpack-boost' ) }
				>
					{ __( 'Clear cache', 'jetpack-boost' ) }
				</Button>
			</div>
			<CollapsibleMeta
				exceptions={ bypassPatterns }
				countExceptions
				tracksEvent="page_cache_exceptions_panel_toggle"
				tracksEventProps={ { panel_scope: 'exceptions' } }
			>
				<div className={ styles.body }>{ exceptions }</div>
			</CollapsibleMeta>
			<Stack
				direction="row"
				justify="space-between"
				align="flex-start"
				gap="md"
				className={ modernStyles.well }
			>
				<ToggleControl
					label={ __( 'Enable logging', 'jetpack-boost' ) }
					help={ __( 'Track all your cache events', 'jetpack-boost' ) }
					checked={ logging }
					onChange={ setLogging }
					__nextHasNoMarginBottom
				/>
				{ logging && (
					<WPLink
						href="#/cache-debug-log"
						onClick={ handleSeeLogsClick }
						className={ modernStyles[ 'see-logs' ] }
					>
						{ __( 'See logs', 'jetpack-boost' ) }
					</WPLink>
				) }
			</Stack>
		</div>
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
	const exceptionsFieldRef = useRef< HTMLTextAreaElement >( null );

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
			data-except-content
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
			<label htmlFor="jb-cache-exceptions">
				{ __( 'URLs of pages and posts that will never be cached:', 'jetpack-boost' ) }
			</label>
			<textarea
				ref={ exceptionsFieldRef }
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
					__( '<help>See examples</help> or <link>learn more</link>.', 'jetpack-boost' ),
					{
						// children are passed after the interpolation.
						help: <BypassPatternsExample exceptionsFieldRef={ exceptionsFieldRef } />,
						link: <WPLink openInNewTab href={ exclusionsLink } />,
					}
				) }
			</div>
			{ showNotice && (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'Error: Unable to save changes.', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>
						{ __( 'An error occurred while saving changes. Please, try again.', 'jetpack-boost' ) }
					</Notice.Description>
					<Notice.CloseIconButton
						onClick={ () => setShowNotice( false ) }
						label={ __( 'Dismiss', 'jetpack-boost' ) }
					/>
				</Notice.Root>
			) }
			<SaveButton
				disabled={ patterns === inputValue || inputInvalid }
				onClick={ save }
				className={ styles.button }
			/>
		</div>
	);
};

type BypassPatternsExampleProps = {
	children?: ReactNode;
	exceptionsFieldRef: RefObject< HTMLTextAreaElement >;
};

const BypassPatternsExample = ( { children, exceptionsFieldRef }: BypassPatternsExampleProps ) => {
	const tooltipLayer = useTooltipLayer();

	return (
		<IconTooltip
			trigger={ children }
			closeOnClickOutsideExceptRef={ exceptionsFieldRef }
			className={ styles[ 'example-trigger' ] }
			onTriggerClick={ () => recordBoostEvent( 'page_cache_see_example_clicked', {} ) }
			placement="bottom-start"
			popoverAnchorStyle="wrapper"
			offset={ -10 }
			popoverClassName={ styles.tooltip }
			{ ...tooltipLayer }
		>
			<strong>{ __( 'Examples:', 'jetpack-boost' ) }</strong>
			<br />
			checkout
			<br />
			gallery/.*
			<br />
			specific-page
		</IconTooltip>
	);
};

export default () => {
	return (
		<ErrorBoundary
			fallback={ _error => (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'Error', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>
						{ __( 'Unable to load Cache settings.', 'jetpack-boost' ) }
					</Notice.Description>
				</Notice.Root>
			) }
		>
			<Meta />
		</ErrorBoundary>
	);
};
