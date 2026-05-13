import { getRedirectUrl } from '@automattic/jetpack-components';
import { ToggleControl, TextareaControl } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Badge, Button, Card, CollapsibleCard, Link as WPLink, Notice, Stack } from '@wordpress/ui';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { usePageCache, useClearPageCacheAction } from '$lib/stores/page-cache';
import { useMutationNotice } from '$features/ui';
import { useDataSyncSubset } from '@automattic/jetpack-react-data-sync-client';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';
import { recordBoostEvent } from '$lib/utils/analytics';

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

	const handlePanelToggle = ( open: boolean ) => {
		recordBoostEvent( 'page_cache_exceptions_panel_toggle', {
			status: open ? 'open' : 'close',
		} );
	};

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue.split( '\n' ).map( line => line.trim() );

		recordBoostEvent( 'page_cache_bypass_patterns', {
			total: newPatterns.length,
		} );
		mutateBypassPatterns.mutate( newPatterns );
	};

	const toggleLogging = ( value: boolean ) => {
		recordBoostEvent( 'page_cache_toggle_logging', { enabled: Number( value ) } );
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

	if ( ! pageCache ) {
		return null;
	}

	const totalBypassPatterns = bypassPatterns?.length || 0;
	const summary = ( () => {
		if ( runClearPageCacheAction.isPending ) {
			return __( 'Clearing cache…', 'jetpack-boost' );
		}
		const exceptionsLine =
			totalBypassPatterns > 0
				? sprintf(
						/* translators: %d is the number of cache bypass patterns. */
						_n( '%d exception.', '%d exceptions.', totalBypassPatterns, 'jetpack-boost' ),
						totalBypassPatterns
				  )
				: __( 'No exceptions.', 'jetpack-boost' );
		const loggingLine = logging
			? __( 'Logging activated.', 'jetpack-boost' )
			: __( 'No logging.', 'jetpack-boost' );
		return `${ exceptionsLine } ${ loggingLine }`;
	} )();

	return (
		<Stack direction="column" gap="md" data-testid="page-cache-meta">
			<CollapsibleCard.Root onOpenChange={ handlePanelToggle }>
				<CollapsibleCard.Header>
					<Stack direction="row" justify="space-between" align="center">
						<Card.Title>{ __( 'Cache options', 'jetpack-boost' ) }</Card.Title>
						{ summary && <Badge intent="none">{ summary }</Badge> }
					</Stack>
				</CollapsibleCard.Header>
				<CollapsibleCard.Content>
					<Stack direction="column" gap="lg">
						<BypassPatterns
							patterns={ bypassPatterns.join( '\n' ) }
							setPatterns={ updatePatterns }
							showErrorNotice={ mutateBypassPatterns.isError }
						/>
						<Stack direction="column" gap="xs">
							<ToggleControl
								__nextHasNoMarginBottom
								label={ __( 'Activate logging to track all your cache events.', 'jetpack-boost' ) }
								checked={ !! logging }
								onChange={ toggleLogging }
							/>
							{ logging && (
								<Link onClick={ handleSeeLogsClick } to="/cache-debug-log">
									{ __( 'See Logs', 'jetpack-boost' ) }
								</Link>
							) }
						</Stack>
						<Stack direction="row">
							<Button
								variant="outline"
								tone="neutral"
								size="compact"
								onClick={ clearPageCache }
								disabled={ runClearPageCacheAction.isPending }
							>
								{ __( 'Clear cache', 'jetpack-boost' ) }
							</Button>
						</Stack>
					</Stack>
				</CollapsibleCard.Content>
			</CollapsibleCard.Root>
		</Stack>
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
		<Stack direction="column" gap="md">
			<TextareaControl
				__nextHasNoMarginBottom
				label={ __( 'Exceptions', 'jetpack-boost' ) }
				help={ createInterpolateElement(
					__(
						'URLs of pages and posts that will never be cached. Use (.*) to address multiple URLs under a given path. Be sure each URL path is in its own line. <link>Learn more</link>.',
						'jetpack-boost'
					),
					{
						link: <WPLink openInNewTab href={ exclusionsLink } />,
					}
				) }
				value={ inputValue }
				rows={ 3 }
				onChange={ validateInputValue }
			/>
			{ inputInvalid && (
				<Notice.Root intent="error">
					<Notice.Description>{ __( 'Invalid format', 'jetpack-boost' ) }</Notice.Description>
				</Notice.Root>
			) }
			{ showNotice && (
				<Notice.Root intent="error">
					<Notice.Title>{ __( 'Unable to save changes', 'jetpack-boost' ) }</Notice.Title>
					<Notice.Description>
						{ __( 'An error occurred while saving changes. Please, try again.', 'jetpack-boost' ) }
					</Notice.Description>
					<Notice.CloseIcon
						onClick={ () => setShowNotice( false ) }
						label={ __( 'Dismiss', 'jetpack-boost' ) }
					/>
				</Notice.Root>
			) }
			<Stack direction="row" gap="sm" align="center">
				<Button
					size="compact"
					disabled={ patterns === inputValue || inputInvalid }
					onClick={ save }
				>
					{ __( 'Save', 'jetpack-boost' ) }
				</Button>
			</Stack>
		</Stack>
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
