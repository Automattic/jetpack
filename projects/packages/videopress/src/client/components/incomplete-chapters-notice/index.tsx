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
import type { ChapterValidationIssue } from '../../utils/video-chapters/description';
import type { ReactElement } from 'react';

type IncompleteChaptersNoticeProps = {
	className?: string;
	issues: ChapterValidationIssue[];
};

const IncompleteChaptersNotice = ( {
	className,
	issues,
}: IncompleteChaptersNoticeProps ): ReactElement => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const messages = [ ...new Set( issues.map( issue => issue.message ) ) ];

	return (
		<>
			<Notice status="warning" className={ className } isDismissible={ false }>
				{ messages.map( message => (
					<p key={ message }>{ message }</p>
				) ) }
				{ createInterpolateElement(
					__( 'Check the <link>chapter format</link> and try again.', 'jetpack-videopress-pkg' ),
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
