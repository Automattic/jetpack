import { Button } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import Lightning from '$svg/lightning';
import styles from './meta.module.scss';
import { useEffect, useState } from 'react';
import { usePageCache } from '$lib/stores/page-cache';

const Meta = () => {
	const [ isExpanded, setIsExpanded ] = useState( true );
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

	return (
		<div className={ styles.wrapper }>
			<div className={ styles.head }>
				<div className={ styles.summary }>
					{ __( 'No exceptions or logging.', 'jetpack-boost' ) }
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
};

const Exceptions = ( { exceptions, setExceptions }: ExceptionsProps ) => {
	const [ inputValue, setInputValue ] = useState( exceptions );

	// @todo - add proper link.
	const exclusionsLink = 'TBD';

	useEffect( () => {
		setInputValue( exceptions );
	}, [ exceptions ] );

	function save() {
		setExceptions( inputValue );
	}

	function showExample( event: React.MouseEvent ) {
		event.preventDefault();

		// @todo - add proper example.
	}

	return (
		<div className={ styles.section }>
			<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
			<p>{ __( 'URLs of pages and posts that will never be cached:', 'jetpack-boost' ) }</p>
			<textarea value={ inputValue } rows={ 3 } onChange={ e => setInputValue( e.target.value ) } />
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
						help: <a href="#" target="_blank" rel="noreferrer" onClick={ showExample } />,
						// eslint-disable-next-line jsx-a11y/anchor-has-content
						link: <a href={ exclusionsLink } target="_blank" rel="noreferrer" />,
					}
				) }
			</p>
			<Button disabled={ exceptions === inputValue } onClick={ save }>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};
