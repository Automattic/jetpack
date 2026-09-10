import { Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { external } from '@wordpress/icons';
import { Card } from '@wordpress/ui';

const GUIDES = [
	{
		title: __( 'Start a newsletter', 'jetpack-newsletter' ),
		duration: __( '2 min', 'jetpack-newsletter' ),
		url: 'https://wordpress.com/support/newsletter/',
	},
	{
		title: __( 'Send newsletter emails to subscribers', 'jetpack-newsletter' ),
		duration: __( '4 min', 'jetpack-newsletter' ),
		url: 'https://wordpress.com/support/newsletter/send-newsletter-emails/',
	},
	{
		title: __( 'Newsletter settings', 'jetpack-newsletter' ),
		duration: __( '5 min', 'jetpack-newsletter' ),
		url: 'https://wordpress.com/support/newsletter-settings/',
	},
];

/**
 * Render the Newsletter guides card.
 *
 * @return The guides card.
 */
export default function GuidesCard(): JSX.Element {
	return (
		<Card.Root className="jetpack-newsletter-overview__guides">
			<Card.Header>
				<Card.Title>{ __( 'Guides', 'jetpack-newsletter' ) }</Card.Title>
			</Card.Header>
			<Card.Content className="jetpack-newsletter-overview__guides-content">
				<ul className="jetpack-newsletter-overview__guides-list">
					{ GUIDES.map( guide => (
						<li key={ guide.title } className="jetpack-newsletter-overview__guide">
							<a
								className="jetpack-newsletter-overview__guide-link"
								href={ guide.url }
								target="_blank"
								rel="noreferrer"
							>
								<span>
									{ guide.title }{ ' ' }
									<span className="screen-reader-text">
										{ __( 'Opens in a new tab', 'jetpack-newsletter' ) }
									</span>
								</span>
								<span className="jetpack-newsletter-overview__guide-meta">
									<span>{ guide.duration }</span>
									<Icon icon={ external } size={ 20 } aria-hidden="true" />
								</span>
							</a>
						</li>
					) ) }
				</ul>
			</Card.Content>
		</Card.Root>
	);
}
