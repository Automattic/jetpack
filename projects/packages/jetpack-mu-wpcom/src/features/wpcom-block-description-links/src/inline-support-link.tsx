import { localizeUrl } from '@automattic/i18n-utils';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { Button, ExternalLink } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useState, JSXElementConstructor, ReactElement } from 'react';

interface Props {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	children: string | ReactElement< string | JSXElementConstructor< any > >;
	title: string;
	url: string;
	postId: number;
}

/**
 * Create the block description link.
 *
 * @param {Props}                                                      props          - The component props.
 * @param {string | ReactElement<string | JSXElementConstructor<any>>} props.children - The component children.
 * @param {string}                                                     props.title    - Block title.
 * @param {string}                                                     props.url      - Support link URL.
 * @param {number}                                                     props.postId   - Post ID.
 * @return {React.JSX.Element} The component to render.
 */
export default function DescriptionSupportLink( {
	children,
	title,
	url,
	postId,
}: Props ): React.JSX.Element {
	// This was cooked up to only apply the link in the BlockEditor sidebar.
	// Since there was no identifier in the environment to differentiate.
	const [ ref, setRef ] = useState< Element | null >();
	const { tracks } = useAnalytics();
	const helpCenterDispatch = useDispatch( 'automattic/help-center' );
	const setShowHelpCenter = helpCenterDispatch?.setShowHelpCenter;
	const setShowSupportDoc = helpCenterDispatch?.setShowSupportDoc;

	if ( ref && ! ref?.closest( '.block-editor-block-inspector' ) ) {
		return children as React.JSX.Element;
	}

	return (
		<>
			{ children }
			<br />
			{ setShowHelpCenter ? (
				<Button
					onClick={ () => {
						setShowHelpCenter( true );
						setShowSupportDoc( localizeUrl( url ), postId );
						tracks.recordEvent( 'jetpack_mu_wpcom_block_description_support_link_click', {
							block: title,
							support_link: url,
						} );
					} }
					style={ { marginTop: 10, height: 'unset' } }
					ref={ reference => ref !== reference && setRef( reference ) }
					className="fse-inline-support-link is-compact"
					variant="link"
				>
					{ __( 'Block guide', 'jetpack-mu-wpcom' ) }
				</Button>
			) : (
				<ExternalLink
					onClick={ () => {
						tracks.recordEvent( 'jetpack_mu_wpcom_block_description_support_link_click', {
							block: title,
							support_link: url,
						} );
					} }
					ref={ reference => ref !== reference && setRef( reference ) }
					style={ { display: 'block', marginTop: 10, maxWidth: 'fit-content' } }
					className="fse-inline-support-link"
					href={ url }
				>
					{ __( 'Learn more', 'jetpack-mu-wpcom' ) }
				</ExternalLink>
			) }
		</>
	);
}
