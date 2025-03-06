import { Button, Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState, ReactNode } from 'react';
import clsx from 'clsx';
import { recordBoostEvent } from '$lib/utils/analytics';
import styles from './bypass-patterns.module.scss';

export interface BypassPatternsProps {
	patterns: string;
	setPatterns: ( value: string ) => void;
	showErrorNotice?: boolean;
	label: string;
	description: ReactNode;
	errorMessage?: string;
	buttonText?: string;
	onSave?: () => void;
	source: 'page_cache' | 'speculation_rules';
}

export const BypassPatterns = ( {
	patterns,
	setPatterns,
	showErrorNotice = false,
	label,
	description,
	errorMessage,
	buttonText = __( 'Save', 'jetpack-boost' ),
	onSave,
	source,
}: BypassPatternsProps ) => {
	const [ inputValue, setInputValue ] = useState( patterns );
	const [ showNotice, setShowNotice ] = useState( showErrorNotice );
	const [ inputInvalid, setInputInvalid ] = useState( false );

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
			lines.forEach( line => {
				if ( source === 'speculation_rules' ) {
					// For Speculation Rules, only accept * wildcards
					if ( line.includes( '(.*)' ) ) {
						throw new Error( 'Invalid pattern' );
					}
					// Convert * to (.*) for regex validation
					const regexLine = line.replace( /\*/g, '(.*)' );
					const regex = new RegExp( regexLine );
					regex.test( '' );
				} else {
					// For Page Cache, accept only (.*) or none
					const regex = new RegExp( line );
					regex.test( '' );
				}
			} );
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
		if ( onSave ) {
			onSave();
		}
		recordBoostEvent( 'bypass_patterns_save_clicked', {} );
		setPatterns( inputValue );
	}

	return (
		<div
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
			<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
			<label htmlFor="jb-bypass-patterns">{ label }</label>
			<textarea
				value={ inputValue }
				rows={ 3 }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-bypass-patterns"
			/>
			{ inputInvalid && errorMessage && (
				<p className={ clsx( styles.description, styles[ 'error-message' ] ) }>{ errorMessage }</p>
			) }
			<div className={ styles.description }>{ description }</div>
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
				{ buttonText }
			</Button>
		</div>
	);
};
