import { Button, Notice } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { Snackbar } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import Lightning from '$svg/lightning';
import styles from './meta.module.scss';
import { useEffect, useState } from 'react';
import { usePageCache, useClearPageCacheAction } from '$lib/stores/page-cache';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ query, mutation ] = usePageCache();
	const [ clearingCache, setClearingCache ] = useState( false );
	const [ snackbarMessage, setSnackbarMessage ] = useState< string >( '' );
	const runClearPageCacheAction = useClearPageCacheAction();

	const settings = query?.data;
	const setSettings = mutation.mutate;

	const setLogging = ( newValue: boolean ) => {
		if ( ! setSettings || ! settings ) {
			return;
		}

		setSettings( {
			...settings,
			logging: newValue,
		} );
	};

	const setBypassPatterns = ( newValue: string ) => {
		if ( ! setSettings || ! settings ) {
			return;
		}

		setSettings( {
			...settings,
			bypass_patterns: newValue.split( '\n' ).map( item => item.trim() ),
		} );
	};

	const clearPageCache = () => {
		setClearingCache( true );
		setSnackbarMessage( '' ); // Hide any previous snackbar message.
		runClearPageCacheAction.mutate();
	};

	useEffect( () => {
		if (
			clearingCache &&
			( runClearPageCacheAction.isSuccess || runClearPageCacheAction.isError )
		) {
			setClearingCache( false );
			setSnackbarMessage( __( 'Cache Cleared.', 'jetpack-boost' ) );
		}
	}, [ clearingCache, runClearPageCacheAction ] );

	const totalBypassPatterns = settings?.bypass_patterns.length || 0;

	const getSummary = () => {
		if ( clearingCache ) {
			return __( 'Clearing cache…', 'jetpack-boost' );
		}

		if ( totalBypassPatterns === 0 && ! settings?.logging ) {
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
				{ settings?.logging && __( 'Logging activated.', 'jetpack-boost' ) }
				{ ! settings?.logging && __( 'No logging.', 'jetpack-boost' ) }
			</>
		);
	};

	return (
		<div className={ styles.wrapper }>
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
						disabled={ clearingCache }
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
					{ settings && (
						<>
							<BypassPatterns
								patterns={ settings.bypass_patterns.join( '\n' ) }
								setPatterns={ setBypassPatterns }
								showErrorNotice={ mutation.isError }
							/>
							<div className={ styles.section }>
								<div className={ styles.title }>{ __( 'Logging', 'jetpack-boost' ) }</div>
								<label htmlFor="cache-logging">
									<input
										type="checkbox"
										id="cache-logging"
										checked={ settings.logging }
										onChange={ event => setLogging( event.target.checked ) }
									/>{ ' ' }
									{ __( 'Activate logging to track all your cache events.', 'jetpack-boost' ) }
									{ settings.logging && (
										<>
											{ ' ' }
											<Link to="/cache-debug-log">{ __( 'See Logs', 'jetpack-boost' ) }</Link>
										</>
									) }
								</label>
							</div>
						</>
					) }
				</div>
			) }
			{ snackbarMessage !== '' && (
				<Snackbar children={ snackbarMessage } onDismiss={ () => setSnackbarMessage( '' ) } />
			) }
		</div>
	);
};

export default Meta;

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
	const [ inputInvalid, setInputInvalid ] = useState( false ); // @todo - implement this

	// @todo - add proper link.
	const exclusionsLink = 'https://jetpack.com';

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
			className={ classNames( styles.section, {
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
				onChange={ e => setInputValue( e.target.value ) }
				id="jb-cache-exceptions"
			/>
			<p className={ classNames( styles.description, styles[ 'error-message' ] ) }>
				{ __( 'Error: Invalid format', 'jetpack-boost' ) }
			</p>
			<p className={ styles.description }>
				{ __(
					'Use (.*) to address multiple URLs under a given path. Be sure each URL path is in its own line.',
					'jetpack-boost'
				) }
				<br />
				{ createInterpolateElement(
					__( '<help>See an example</help> or <link>learn more</link>.', 'jetpack-boost' ),
					{
						// eslint-disable-next-line jsx-a11y/anchor-has-content, jsx-a11y/anchor-is-valid
						help: <a href="#" target="_blank" rel="noreferrer" />,
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						link: <a href={ exclusionsLink } target="_blank" rel="noreferrer" />,
					}
				) }
			</p>
			{ showNotice && (
				<Notice
					level="error"
					title={ __( 'Error: Unable to save changes.', 'jetpack-boost' ) }
					onClose={ () => setShowNotice( false ) }
				>
					{ __( 'An error occurred while saving changes. Please, try again.', 'jetpack-boost' ) }
				</Notice>
			) }
			<Button disabled={ patterns === inputValue } onClick={ save } className={ styles.button }>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};
