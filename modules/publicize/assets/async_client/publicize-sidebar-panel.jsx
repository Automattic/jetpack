/**
 * Publicize sidebar panel component.
 *
 * Top level component to be displayed in the
 * post-publish sidebar panel view. Shows list of
 * connections and allows user to edit sharing message
 * before post is shared with Publicize.
 *
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
const { __ } = wp.i18n;
import PublicizeShare from './publicize-share'
import PublicizeResults from './publicize-results'
import PublicizeConnections from './publicize-connections'


class PublicizeSidebarPanel extends Component {

	doneSharing = () => {
		alert("finished sharing")
	};

	render() {
		return (
			<div className='jetpack-publicize-sidebar-panel'>
				<div className='jetpack-publicize-sidebar-title'>{ __('Share this post') }</div>
				<div>{ __('Connect and select social media services to share share this post.') }</div>
				<PublicizeConnections/>
				<PublicizeShare/>
				<PublicizeResults/>
			</div>
		);
	}
}

export default PublicizeSidebarPanel;

