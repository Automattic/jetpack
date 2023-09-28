import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import './style.scss';

export default function BlogrollAppenderResults( {
	results,
	showPlaceholder,
	onSelect,
	isLoading,
} ) {
	const [ siteRecommendations ] = useEntityProp( 'root', 'site', 'Blogroll Recommendations' );
	return (
		<div className="jetpack-blogroll__appender-results">
			{ showPlaceholder && <div aria-autocomplete="list">{ __( 'Suggestions', 'jetpack' ) }</div> }

			{ isLoading && <div role="status">{ __( 'Loading…', 'jetpack' ) }</div> }

			{ ! isLoading && results.length === 0 && ! showPlaceholder && (
				<div role="status">{ __( 'No websites found.', 'jetpack' ) }</div>
			) }
			{ results.length > 0 && (
				<ul aria-live="polite">
					{ results.map( result => {
						const isDuplicate = siteRecommendations.some( siteRecommendation => {
							return siteRecommendation?.id === result?.blog_id;
						} );

						return (
							<li key={ result.blog_id } className="jetpack-blogroll__appender-result-container">
								<button
									className="jetpack-blogroll__appender-result-title"
									disabled={ isDuplicate }
									onClick={ () => onSelect( result ) }
								>
									<div className="jetpack-blogroll__appender-result-image">
										{ result.site_icon && <img src={ result.site_icon } alt={ result.name } /> }
									</div>
									<div className="jetpack-blogroll__appender-result-text">
										<span className="jetpack-blogroll__appender-result-title">{ result.name }</span>
										<span className="jetpack-blogroll__appender-result-description">
											{ result.description }
										</span>
									</div>
								</button>
							</li>
						);
					} ) }
				</ul>
			) }
		</div>
	);
}
