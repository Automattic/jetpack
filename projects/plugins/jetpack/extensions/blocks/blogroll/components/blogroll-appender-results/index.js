import { __ } from '@wordpress/i18n';
import './style.scss';

export default function BlogrollAppenderResults( { subscriptions, showPlaceholder, onSelect } ) {
	return (
		<div className="jetpack-blogroll__appender-results">
			{ showPlaceholder && <span>{ __( 'Suggestions', 'jetpack' ) }</span> }

			<ul aria-live="polite">
				{ subscriptions.map( subscription => (
					<li key={ subscription.blog_id }>
						<a
							className="jetpack-blogroll__appender-result-title"
							href="#"
							onClick={ () => onSelect( subscription ) }
						>
							<div className="jetpack-blogroll__appender-result-image">
								{ subscription.site_icon && (
									<img src={ subscription.site_icon } alt={ subscription.name } />
								) }
							</div>

							<div className="jetpack-blogroll__appender-result-text">
								<span className="jetpack-blogroll__appender-result-title">
									{ subscription.name }
								</span>
								<span className="jetpack-blogroll__appender-result-description">
									{ subscription.description }
								</span>
							</div>
						</a>
					</li>
				) ) }
			</ul>
		</div>
	);
}
