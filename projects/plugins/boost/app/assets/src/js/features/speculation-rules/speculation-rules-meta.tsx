import { Button, Notice } from '@automattic/jetpack-components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { useEffect, useState } from 'react';
import { useDataSyncSubset } from '@automattic/jetpack-react-data-sync-client';
import { useSpeculationRules } from '$lib/stores/speculation-rules';
import ErrorBoundary from '$features/error-boundary/error-boundary';
import ErrorNotice from '$features/error-notice/error-notice';
import { recordBoostEvent } from '$lib/utils/analytics';
import CollapsibleMeta from '$features/ui/collapsible-meta/collapsible-meta';
import styles from './speculation-rules-meta.module.scss';
import clsx from 'clsx';

const Meta = () => {
	const speculationRules = useSpeculationRules();
	const [ patterns, mutateBypassPatterns ] = useDataSyncSubset(
		speculationRules,
		'bypass_patterns'
	);
	const totalBypassPatterns = patterns?.length || 0;

	const getSummary = () => {
		return totalBypassPatterns > 0
			? sprintf(
					/* translators: %d is the number of bypass patterns. */
					_n( '%d exception.', '%d exceptions.', totalBypassPatterns, 'jetpack-boost' ),
					totalBypassPatterns
			  )
			: __( 'No exceptions.', 'jetpack-boost' );
	};

	const updatePatterns = ( newValue: string ) => {
		const newPatterns = newValue
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line !== '' );

		recordBoostEvent( 'speculation_rules_bypass_patterns', {
			total: newPatterns.length,
		} );
		mutateBypassPatterns.mutate( newPatterns );
	};

	const content = (
		<div className={ styles.body }>
			<BypassPatterns
				patterns={ patterns.join( '\n' ) }
				setPatterns={ updatePatterns }
				showErrorNotice={ mutateBypassPatterns.isError }
			/>
		</div>
	);

	return (
		speculationRules && (
			<div className={ styles.wrapper } data-testid="speculation-rules-meta">
				<CollapsibleMeta
					headerText={ getSummary() }
					toggleText={ __( 'Show Options', 'jetpack-boost' ) }
					tracksEvent={ 'speculation_rules_exceptions_panel_toggle' }
				>
					{ content }
				</CollapsibleMeta>
			</div>
		)
	);
};

interface BypassPatternsProps {
	patterns: string;
	setPatterns: ( value: string ) => void;
	showErrorNotice?: boolean;
}

const BypassPatterns = ( {
	patterns,
	setPatterns,
	showErrorNotice = false,
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
		recordBoostEvent( 'speculation_rules_exceptions_save_clicked', {} );
		setPatterns( inputValue );
	}

	return (
		<div
			className={ clsx( styles.section, {
				[ styles[ 'has-error' ] ]: inputInvalid,
			} ) }
		>
			<div className={ styles.title }>{ __( 'Exceptions', 'jetpack-boost' ) }</div>
			<label htmlFor="jb-speculation-rules-exceptions">
				{ __(
					'URLs of pages and posts that will not have speculation rules applied:',
					'jetpack-boost'
				) }
			</label>
			<textarea
				value={ inputValue }
				rows={ 3 }
				onChange={ e => validateInputValue( e.target.value ) }
				id="jb-speculation-rules-exceptions"
			/>
			<div className={ styles.description }>
				{ __(
					'Enter one URL per line. These pages will not have speculation rules applied to them.',
					'jetpack-boost'
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
			<Button disabled={ patterns === inputValue } onClick={ save } className={ styles.button }>
				{ __( 'Save', 'jetpack-boost' ) }
			</Button>
		</div>
	);
};

export default () => {
	return (
		<ErrorBoundary
			fallback={
				<ErrorNotice
					title={ __( 'Error', 'jetpack-boost' ) }
					error={ new Error( __( 'Unable to load Speculation Rules settings.', 'jetpack-boost' ) ) }
				/>
			}
		>
			<Meta />
		</ErrorBoundary>
	);
};
