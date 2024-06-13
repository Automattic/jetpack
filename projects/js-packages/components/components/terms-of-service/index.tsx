import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import { getRedirectUrl } from '../../../components';
import Text from '../text';
import type { TermsOfServiceProps } from './types';
import './styles.scss';

const TermsOfService: React.FC< TermsOfServiceProps > = ( {
	className,
	multipleButtons,
	agreeButtonLabel,
} ) => (
	<Text className={ clsx( className, 'terms-of-service' ) }>
		{ multipleButtons ? (
			<MultipleButtonsText multipleButtonsLabels={ multipleButtons } />
		) : (
			<SingleButtonText agreeButtonLabel={ agreeButtonLabel } />
		) }
	</Text>
);

const MultipleButtonsText = ( { multipleButtonsLabels } ) => {
	if ( Array.isArray( multipleButtonsLabels ) && multipleButtonsLabels.length > 1 ) {
		return createInterpolateElement(
			sprintf(
				/* translators: %1$s is button label 1 and %2$s is button label 2 */
				__(
					'By clicking <strong>%1$s</strong> or <strong>%2$s</strong>, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>sync your site‘s data</shareDetailsLink> with us.',
					'jetpack'
				),
				multipleButtonsLabels[ 0 ],
				multipleButtonsLabels[ 1 ]
			),
			{
				strong: <strong />,
				tosLink: <Link slug="wpcom-tos" />,
				shareDetailsLink: <Link slug="jetpack-support-what-data-does-jetpack-sync" />,
			}
		);
	}

	return createInterpolateElement(
		__(
			'By clicking the buttons above, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>sync your site‘s data</shareDetailsLink> with us.',
			'jetpack'
		),
		{
			tosLink: <Link slug="wpcom-tos" />,
			shareDetailsLink: <Link slug="jetpack-support-what-data-does-jetpack-sync" />,
		}
	);
};

const SingleButtonText = ( { agreeButtonLabel } ) =>
	createInterpolateElement(
		sprintf(
			/* translators: %s is a button label */
			__(
				'By clicking <strong>%s</strong>, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>sync your site‘s data</shareDetailsLink> with us.',
				'jetpack'
			),
			agreeButtonLabel
		),
		{
			strong: <strong />,
			tosLink: <Link slug="wpcom-tos" />,
			shareDetailsLink: <Link slug="jetpack-support-what-data-does-jetpack-sync" />,
		}
	);

const Link: React.FC< { slug: string; children?: React.ReactNode } > = ( { slug, children } ) => (
	<a
		className="terms-of-service__link"
		href={ getRedirectUrl( slug ) }
		rel="noopener noreferrer"
		target="_blank"
	>
		{ children }
	</a>
);

export default TermsOfService;
