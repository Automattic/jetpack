import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import './style.scss';

export default function BlogrollAppenderResults( {
	results,
	showPlaceholder,
	onSelect,
	isLoading,
} ) {
  const [ siteRecommendations ] = useEntityProp( 'root', 'site', 'Blogroll Recommendations' );

	// Check if site is already appended to the blogroll
	// If it is, add a duplicateRecommendation flag to the site object
	const updatedResults = results?.map( result => {
		const itemBlogrollItem = siteRecommendations.find( siteRecommendation => {
			return siteRecommendation?.id === result?.blog_id;
		} );
		if ( itemBlogrollItem ) {
			return { ...result, duplicateRecommendation: true };
		}
		return result;
	} );
  
	return (
		<div className="jetpack-blogroll__appender-results">
			{ showPlaceholder && <div aria-autocomplete="list">{ __( 'Suggestions', 'jetpack' ) }</div> }

			{ isLoading && <div role="status">{ __( 'Loading…', 'jetpack' ) }</div> }

			{ ! isLoading && updatedResults.length === 0 && ! showPlaceholder && (
				<div role="status">{ __( 'No websites found.', 'jetpack' ) }</div>
			) }
			{ updatedResults.length > 0 && (
				<ul aria-live="polite">
					{ updatedResults.map( result => (
						<li
							key={ result.blog_id }
							className={ classNames( 'jetpack-blogroll__appender-result-container', {
								'is-disabled-result': result?.duplicateRecommendation,
							} ) }
						>
							<a
								className="jetpack-blogroll__appender-result-title"
								href="#"
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
							</a>
						</li>
					) ) }
				</ul>
			) }
		</div>
	);
}
