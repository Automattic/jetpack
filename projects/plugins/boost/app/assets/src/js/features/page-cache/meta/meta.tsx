import { Button, Notice } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import Lightning from '$svg/lightning';
import styles from './meta.module.scss';
import { useEffect, useState } from 'react';
import { usePageCache } from '$lib/stores/page-cache';
import { Link } from 'react-router-dom';
import classNames from 'classnames';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( false );
	const [ query, mutation ] = usePageCache();

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

	const setExceptions = ( newValue: string ) => {
		if ( ! setSettings || ! settings ) {
			return;
		}

		setSettings( {
			...settings,
			exceptions: newValue.split( '\n' ).map( item => item.trim() ),
		} );
	};

	const totalExceptions = settings?.exceptions.length || 0;

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.head }>
				<div className={ styles.summary }>
					{ totalExceptions === 0 && ! settings?.logging ? (
						__( 'No exceptions or logging.', 'jetpack-boost' )
					) : (
						<>
							{ totalExceptions > 0 ? (
								<>
									{ sprintf(
										/* translators: %d is the number of exceptions. */
										_n( '%d exception.', '%d exceptions.', totalExceptions, 'jetpack-boost' ),
										totalExceptions
									) }
								</>
							) : (
								__( 'No exceptions.', 'jetpack-boost' )
							) }{ ' ' }
							{ settings?.logging && __( 'Logging activated.', 'jetpack-boost' ) }
							{ ! settings?.logging && __( 'No logging.', 'jetpack-boost' ) }
						</>
					) }
				</div>
				<div className={ styles.actions }>
					<Button
						variant="link"
						size="small"
						weight="regular"
						iconSize={ 16 }
						icon={ <Lightning /> }
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
							<Exceptions
								exceptions={ settings.exceptions.join( '\n' ) }
								setExceptions={ setExceptions }
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
		</div>
	);
};

export default Meta;

type ExceptionsProps = {
	exceptions: string;
	setExceptions: ( newValue: string ) => void;
	showErrorNotice: boolean;
};

const Exceptions = ( { exceptions, setExceptions, showErrorNotice = false }: ExceptionsProps ) => {
	const [ inputValue, setInputValue ] = useState( exceptions );
	const [ showNotice, setShowNotice ] = useState( showErrorNotice );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [ inputInvalid, setInputInvalid ] = useState( false ); // @todo - implement this

	// @todo - add proper link.
	const exclusionsLink = 'https://jetpack.com';

	useEffect( () => {
		setInputValue( exceptions );
	}, [ exceptions ] );

	useEffect( () => {
		setShowNotice( showErrorNotice );
	}, [ showErrorNotice ] );

	function save() {
		setExceptions( inputValue );
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
			<Button disabled={ exceptions === inputValue } onClick={ save } className={ styles.button }>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};
