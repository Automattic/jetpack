/* eslint-disable no-console */
/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { useState, useCallback } from 'react';

/**
 * Error Tracker Test Component
 * Creates various types of errors to test the JPJSErrorTracker functionality
 * @return {JSX.Element} The ErrorTrackerTest component
 */
const ErrorTrackerTest = () => {
	const [ errorCount, setErrorCount ] = useState( 0 );

	const triggerJavaScriptError = useCallback( () => {
		// This will throw a TypeError
		const obj = null;
		obj.nonExistentMethod();
	}, [] );

	const triggerPromiseRejection = useCallback( () => {
		// This will create an unhandled promise rejection
		Promise.reject( new Error( 'Test promise rejection from My Jetpack' ) );
	}, [] );

	const triggerNetworkError = useCallback( () => {
		// This will trigger a network error
		fetch( '/non-existent-endpoint-test-error' )
			.then( response => response.json() )
			.catch( error => {
				console.log( 'Network error caught:', error );
			} );
	}, [] );

	const triggerResourceError = useCallback( () => {
		// This will trigger a resource loading error
		const img = document.createElement( 'img' );
		img.src = '/non-existent-image-test.jpg';
		document.body.appendChild( img );

		// Remove after a short delay to clean up
		setTimeout( () => {
			if ( img.parentNode ) {
				img.parentNode.removeChild( img );
			}
		}, 1000 );
	}, [] );

	const triggerTypeError = useCallback( () => {
		// This will trigger a type error
		const undefinedVar = undefined;
		undefinedVar.someProperty.anotherProperty = 'test';
	}, [] );

	const triggerReferenceError = useCallback( () => {
		// This will trigger a reference error
		// eslint-disable-next-line no-undef
		nonExistentFunction();
	}, [] );

	const checkErrorHistory = useCallback( () => {
		if ( window.myJetpackErrorTracker ) {
			const history = window.myJetpackErrorTracker.getErrorHistory();
			const count = window.myJetpackErrorTracker.getErrorCount();
			console.log( 'Error History:', history );
			console.log( 'Error Count:', count );
			setErrorCount( count );
		} else {
			console.log( 'Error tracker not initialized' );
		}
	}, [ setErrorCount ] );

	const clearErrors = useCallback( () => {
		if ( window.myJetpackErrorTracker ) {
			window.myJetpackErrorTracker.clearErrors();
			setErrorCount( 0 );
			console.log( 'Errors cleared' );
		}
	}, [ setErrorCount ] );

	return (
		<div
			style={ {
				border: '2px solid #ff6b6b',
				padding: '20px',
				margin: '20px 0',
				borderRadius: '8px',
				backgroundColor: '#fff5f5',
			} }
		>
			<h3>🚨 Error Tracker Test Panel</h3>
			<p>
				Use these buttons to test different types of errors. Check the browser console to see the
				JPJSErrorTracker output.
			</p>

			<div style={ { marginBottom: '10px' } }>
				<strong>Current Error Count: { errorCount }</strong>
			</div>

			<div style={ { display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '15px' } }>
				<Button
					variant="secondary"
					onClick={ triggerJavaScriptError }
					style={ { backgroundColor: '#ff4757', color: 'white' } }
				>
					JavaScript Error
				</Button>

				<Button
					variant="secondary"
					onClick={ triggerPromiseRejection }
					style={ { backgroundColor: '#ff6348', color: 'white' } }
				>
					Promise Rejection
				</Button>

				<Button
					variant="secondary"
					onClick={ triggerNetworkError }
					style={ { backgroundColor: '#ff7675', color: 'white' } }
				>
					Network Error
				</Button>

				<Button
					variant="secondary"
					onClick={ triggerResourceError }
					style={ { backgroundColor: '#fd79a8', color: 'white' } }
				>
					Resource Error
				</Button>

				<Button
					variant="secondary"
					onClick={ triggerTypeError }
					style={ { backgroundColor: '#e17055', color: 'white' } }
				>
					Type Error
				</Button>

				<Button
					variant="secondary"
					onClick={ triggerReferenceError }
					style={ { backgroundColor: '#a29bfe', color: 'white' } }
				>
					Reference Error
				</Button>
			</div>

			<div style={ { display: 'flex', gap: '10px' } }>
				<Button variant="primary" onClick={ checkErrorHistory }>
					Check Error History
				</Button>

				<Button variant="secondary" onClick={ clearErrors }>
					Clear Errors
				</Button>
			</div>

			<div style={ { marginTop: '15px', fontSize: '14px', color: '#666' } }>
				<strong>Note:</strong> Open browser console to see detailed error tracking output from
				JPJSErrorTracker
			</div>
		</div>
	);
};

export default ErrorTrackerTest;
