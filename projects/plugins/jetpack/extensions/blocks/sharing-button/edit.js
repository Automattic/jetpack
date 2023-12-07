import { useBlockProps } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { withSelect } from '@wordpress/data';
import { store } from '@wordpress/editor';
import { __, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import classNames from 'classnames';
import { useEffect } from 'react';
import SocialIcon from 'social-logos';
import { getNameBySite } from './utils';
import './style.scss';

const mountLink = ( service, post ) => {
	if ( 'email' === service ) {
		return addQueryArgs( 'mailto:', {
			subject: sprintf(
				/* translators: placeholder is post title. */
				__( 'Shared post: %s', 'jetpack' ),
				post.title
			),
			body: post.link,
		} );
	}
	return addQueryArgs( post.link, {
		share: service,
		nb: 1,
	} );
};

const SharingButtonEdit = ( { attributes, context, setAttributes, post } ) => {
	const { service, label } = attributes;
	const { styleType } = context;

	useEffect( () => {
		const url = mountLink( service, post );
		setAttributes( { url } );
	}, [ service, post, setAttributes ] );

	const socialLinkName = getNameBySite( service );
	const socialLinkLabel = label ?? socialLinkName;

	const sharingButtonClass = classNames(
		'jetpack-sharing-button__button',
		'style-' + styleType,
		'share-' + service
	);

	const blockProps = useBlockProps( {
		className: 'jetpack-sharing-button__list-item',
	} );

	return (
		<>
			<li { ...blockProps }>
				<Button className={ sharingButtonClass }>
					<SocialIcon icon={ service } size={ 24 } />
					<span className={ 'jetpack-sharing-button__service-label' }>{ socialLinkLabel }</span>
				</Button>
			</li>
		</>
	);
};

export default withSelect( select => {
	return {
		post: select( store ).getCurrentPost(),
	};
} )( SharingButtonEdit );
