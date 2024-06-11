import clsx from 'clsx';
import { translate } from '../i18n';
import { commentParent } from '../state';
import { CustomLoadingSpinner } from './custom-loading-spinner';

export const EditorPlaceholder = ( { onClick, loading } ) => {
	return (
		<div
			className="verbum-editor-wrapper"
			role="presentation"
			onClick={ onClick }
			onKeyDown={ onClick }
		>
			<div
				class={ clsx( 'editor__main loading-placeholder', {
					loading,
				} ) }
			>
				<div
					class="block-list-appender block-editor-block-list__layout"
					style={ { padding: '10px 20px' } }
				>
					{ loading ? (
						<CustomLoadingSpinner />
					) : (
						<p
							class="block-editor-block-list__layout__content"
							style={ { margin: '18px 0', fontSize: '16px' } }
						>
							{ commentParent.value
								? translate( 'Write a reply...' )
								: translate( 'Write a comment...' ) }
						</p>
					) }
				</div>
			</div>
		</div>
	);
};
