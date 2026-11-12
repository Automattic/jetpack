/**
 * External dependencies
 */
import { Spinner } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import './style.scss';
import type { JSX } from 'react';

/**
 * Spinner shown on the empty spam/trash buttons and progress snackbar while a delete runs.
 *
 * @return {JSX.Element} The spinner.
 */
export default function DeletingSpinner(): JSX.Element {
	return <Spinner className="jp-forms-deleting-spinner" aria-hidden="true" />;
}
