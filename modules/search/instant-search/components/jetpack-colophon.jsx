/** @jsx h */

/**
 * External dependencies
 */
import { h } from 'preact';
import { __ } from '@wordpress/i18n';

const JetpackColophon = () => {
	return (
		<div className="jetpack-instant-search__jetpack-colophon">
			{ __( 'Search powered by Jetpack', 'jetpack' ) }
		</div>
	);
};

export default JetpackColophon;
