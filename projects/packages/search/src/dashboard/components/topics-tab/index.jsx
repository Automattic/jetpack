import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState } from 'react';

const REST_BASE = '/wp/v2/jetpack-search-topics';

/**
 * Topics tab component for managing AI Answers topic definitions.
 *
 * @return {import('react').ReactElement} TopicsTab component.
 */
export default function TopicsTab() {
	const [ topics, setTopics ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( true );
	const [ error, setError ] = useState( null );

	const adminUrl =
		window?.JETPACK_SEARCH_DASHBOARD_INITIAL_STATE?.siteData?.adminUrl ?? '/wp-admin/';

	const loadTopics = () => {
		setIsLoading( true );
		setError( null );
		apiFetch( { path: REST_BASE + '?per_page=100&status=any' } )
			.then( setTopics )
			.catch( err => setError( err.message ) )
			.finally( () => setIsLoading( false ) );
	};

	useEffect( loadTopics, [] );

	const deleteTopic = id => {
		apiFetch( { path: `${ REST_BASE }/${ id }`, method: 'DELETE' } )
			.then( loadTopics )
			.catch( err => setError( err.message ) );
	};

	const newTopicUrl = `${ adminUrl }post-new.php?post_type=jetpack_search_topic`;
	const editUrl = id => `${ adminUrl }post.php?post=${ id }&action=edit`;

	if ( isLoading ) {
		return <p>{ __( 'Loading…', 'jetpack-search-pkg' ) }</p>;
	}

	return (
		<div className="jp-search-topics-tab">
			<div className="jp-search-topics-tab__header">
				<Button variant="primary" href={ newTopicUrl }>
					{ __( 'Add Topic', 'jetpack-search-pkg' ) }
				</Button>
			</div>
			{ error && <p className="jp-search-topics-tab__error">{ error }</p> }
			{ topics.length === 0 ? (
				<p>
					{ __(
						'No topics yet. Add a topic to help the AI answer visitor questions.',
						'jetpack-search-pkg'
					) }
				</p>
			) : (
				<table className="widefat jp-search-topics-tab__table">
					<thead>
						<tr>
							<th>{ __( 'Topic', 'jetpack-search-pkg' ) }</th>
							<th>{ __( 'Keywords', 'jetpack-search-pkg' ) }</th>
							<th>{ __( 'Last Modified', 'jetpack-search-pkg' ) }</th>
							<th></th>
						</tr>
					</thead>
					<tbody>
						{ topics.map( topic => (
							<tr key={ topic.id }>
								<td>
									<a href={ editUrl( topic.id ) }>
										{ topic.title?.rendered || __( '(no title)', 'jetpack-search-pkg' ) }
									</a>
								</td>
								<td>{ topic.meta?._jstopic_keywords ?? '' }</td>
								<td>{ new Date( topic.modified ).toLocaleDateString() }</td>
								<td>
									<Button variant="link" isDestructive onClick={ () => deleteTopic( topic.id ) }>
										{ __( 'Delete', 'jetpack-search-pkg' ) }
									</Button>
								</td>
							</tr>
						) ) }
					</tbody>
				</table>
			) }
		</div>
	);
}
