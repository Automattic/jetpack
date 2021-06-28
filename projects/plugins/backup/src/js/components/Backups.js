/**
 * External dependencies
 */
import React from 'react';
import moment from 'moment';

/**
 * Internal dependencies
 */
import StatBlock from './StatBlock';
import restApi from '../tools/jetpack-rest-api-client';
import './backups-style.scss';
import PostsIcon from './posts.svg';
import CloudIcon from './cloud.svg';
import UploadsIcon from './uploads.svg';
import PluginsIcon from './plugins.svg';
import ThemesIcon from './themes.svg';

class Backups extends React.Component {
	state = {
		progress: 0,
		latest: '',
		stats: {
			posts: 0,
			uploads: 0,
			plugins: 0,
			themes: 0,
		},
		capabilities: [],
		loaded: {
			capabilities: false,
			stats: false,
		},
	};

	componentDidMount() {
		restApi.setApiRoot( this.props.apiRoot );
		restApi.setApiNonce( this.props.apiNonce );
		restApi.fetchRecentBackups().then( res => {
			// If we have no backups don't load up stats
			if ( res.length === 0 ) {
				return;
			}

			const latestBackup = res[ 0 ];
			if ( latestBackup.stats ) {
				this.setState( {
					stats: {
						plugins: latestBackup.stats.plugins.count,
						themes: latestBackup.stats.themes.count,
						uploads: latestBackup.stats.uploads.count,
						posts: latestBackup.stats.tables.wp_posts.post_published, // TODO: Update endpoint to give back posts information instead of relying on wp_posts
					},
					loaded: {
						stats: true,
						capabilities: this.state.loaded.capabilities,
					},
				} );
			}

			if ( latestBackup.progress ) {
				this.setState( { progress: latestBackup.progress } );
			} else {
				this.setState( { progress: 0 } );
			}

			if ( latestBackup.status === 'finished' && latestBackup.last_updated ) {
				this.setState( { latest: latestBackup.last_updated } );
			}
		} );

		// Mocked with simulated delay - Will pull data from end point
		// Simulates a modified /rewind/capabilities response
		setTimeout( () => {
			this.setState( {
				capabilities: [ 'backup', 'realtime-backup' ],
				loaded: {
					capabilities: true,
					stats: this.state.loaded.stats,
				},
			} );
		}, 1000 );
	}

	render() {
		return (
			<div className="jp-wrap">
				<div className="jp-row">
					<div className="lg-col-span-3 md-col-span-4 sm-col-span-4">
						<div className="backup__latest">
							<img src={ CloudIcon } alt="Jetpack Logo" />
							<h2>Latest Backup</h2>
						</div>
						<h1>{ moment.utc( this.state.latest ).fromNow() }</h1>
						<a class="button is-full-width" href="https://cloud.jetpack.com/">
							See all your backups
						</a>
					</div>
					<div className="lg-col-span-1 md-col-span-4 sm-col-span-0"></div>
					<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
						<StatBlock icon={ PostsIcon } label="Posts" value={ this.state.stats.posts } />
					</div>
					<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
						<StatBlock icon={ UploadsIcon } label="Uploads" value={ this.state.stats.uploads } />
					</div>
					<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
						<StatBlock icon={ PluginsIcon } label="Plugins" value={ this.state.stats.plugins } />
					</div>
					<div className="lg-col-span-2 md-col-span-2 sm-col-span-2">
						<StatBlock icon={ ThemesIcon } label="Themes" value={ this.state.stats.themes } />
					</div>
				</div>
			</div>
		);
	}
}

export default Backups;
