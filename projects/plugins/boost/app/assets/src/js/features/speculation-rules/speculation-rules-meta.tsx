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

const Meta = () => {
	const speculationRules = useSpeculationRules();
	const [ exceptions, mutateExceptions ] = useDataSyncSubset( speculationRules, 'exceptions' );
	const totalExceptions = exceptions?.length || 0;

	const getSummary = () => {
		return totalExceptions > 0
			? sprintf(
					/* translators: %d is the number of exception patterns. */
					_n( '%d exception.', '%d exceptions.', totalExceptions, 'jetpack-boost' ),
					totalExceptions
			  )
			: __( 'No exceptions.', 'jetpack-boost' );
	};

	const updateExceptions = ( newValue: string ) => {
		const newExceptions = newValue
			.split( '\n' )
			.map( line => line.trim() )
			.filter( line => line !== '' );

		recordBoostEvent( 'speculation_rules_exceptions', {
			total: newExceptions.length,
		} );
		mutateExceptions.mutate( newExceptions );
	};

	const content = (
		<div className={ styles.body }>
			<Exceptions
				exceptions={ exceptions.join( '\n' ) }
				setExceptions={ updateExceptions }
				showErrorNotice={ mutateExceptions.isError }
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

interface ExceptionsProps {
	exceptions: string;
	setExceptions: ( value: string ) => void;
	showErrorNotice?: boolean;
}

const Exceptions = ( { exceptions, setExceptions, showErrorNotice = false }: ExceptionsProps ) => {
	const [ inputValue, setInputValue ] = useState( exceptions );
	const [ showNotice, setShowNotice ] = useState( showErrorNotice );

	useEffect( () => {
		setInputValue( exceptions );
	}, [ exceptions ] );

	useEffect( () => {
		setShowNotice( showErrorNotice );
	}, [ showErrorNotice ] );

	function save() {
		recordBoostEvent( 'speculation_rules_exceptions_save_clicked', {} );
		setExceptions( inputValue );
	}

	return (
		<div className={ styles.section }>
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
				onChange={ e => setInputValue( e.target.value ) }
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
			<Button disabled={ exceptions === inputValue } onClick={ save } className={ styles.button }>
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
