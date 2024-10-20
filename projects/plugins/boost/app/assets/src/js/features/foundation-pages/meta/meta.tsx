import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import React, { useEffect, useState } from 'react';
import clsx from 'clsx';
import styles from './meta.module.scss';
import { useFoundationPages } from '../lib/stores/foundation-pages';

const Meta = () => {
	const [ foundationPages, setFoundationPages ] = useFoundationPages();

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue.split( '\n' ).map( line => line.trim() );

		setFoundationPages( newPatterns );
	};

	return (
		<div className={ styles.wrapper } data-testid="foundation-pages-meta">
			<div className={ styles.body }>
				<BypassPatterns patterns={ foundationPages.join( '\n' ) } setPatterns={ updatePatterns } />
			</div>
		</div>
	);
};

type BypassPatternsProps = {
	patterns: string;
	setPatterns: ( newValue: string ) => void;
};

const BypassPatterns: React.FC< BypassPatternsProps > = ( { patterns, setPatterns } ) => {
	const [ inputValue, setInputValue ] = useState( patterns );
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
			lines.forEach( line => new RegExp( line ) );
		} catch ( e ) {
			return false;
		}

		return true;
	};

	useEffect( () => {
		setInputValue( patterns );
	}, [ patterns ] );

	function save() {
		setPatterns( inputValue );
	}

	return (
		<div
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
			<textarea
				value={ inputValue }
				rows={ 3 }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-foundation-pages"
			/>
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

export default Meta;
