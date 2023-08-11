/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { Notice } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import LearnHowModal from '../../block-editor/blocks/video/components/details-panel/learn-how-notice';
/**
 * Types
 */
import type React from 'react';

const IncompleteChaptersNotice = ( { className }: { className?: string } ): React.ReactElement => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<>
			<Notice status="warning" className={ className } isDismissible={ false }>
				{ createInterpolateElement(
					__(
						'It seems there are some chapters, but they are incomplete. Check out the <link>format</link> and try again.',
						'jetpack-videopress-pkg'
					),
					{
						link: <Button variant="link" size="small" onClick={ () => setIsModalOpen( true ) } />,
					}
				) }
			</Notice>
			<LearnHowModal onClose={ () => setIsModalOpen( false ) } isOpen={ isModalOpen } />
		</>
	);
};

export default IncompleteChaptersNotice;
