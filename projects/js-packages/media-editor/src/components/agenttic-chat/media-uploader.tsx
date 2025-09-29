/**
 * Media Uploader Utility
 *
 * Handles uploading AI-generated images to the WordPress media library
 * and managing the relationship with original images.
 */

import { uploadMedia } from '@wordpress/media-utils';
import type { MediaItem } from '../../types';

/**
 * Interface for upload configuration
 */
export interface UploadConfig {
	allowedTypes?: string[];
	maxUploadFileSize?: number;
	maxUploadFiles?: number;
}

/**
 * Interface for upload result
 */
export interface UploadResult {
	success: boolean;
	attachment?: MediaItem;
	error?: string;
	uploadId?: number;
}

/**
 * Default upload configuration for AI-edited images
 */
const DEFAULT_CONFIG: UploadConfig = {
	allowedTypes: [ 'image/jpeg', 'image/png', 'image/webp' ],
	maxUploadFileSize: 10 * 1024 * 1024, // 10MB
	maxUploadFiles: 1,
};

/**
 * Media Uploader Service Class
 */
class MediaUploaderService {
	private config: UploadConfig;

	constructor( config: UploadConfig = DEFAULT_CONFIG ) {
		this.config = { ...DEFAULT_CONFIG, ...config };
	}

	/**
	 * Upload an AI-edited image to WordPress media library
	 */
	async uploadAIEditedImage(
		imageBlob: Blob,
		originalAttachment: MediaItem,
		editPrompt: string
	): Promise< UploadResult > {
		try {
			// Validate the blob
			const validation = this.validateImageBlob( imageBlob );
			if ( ! validation.valid ) {
				return {
					success: false,
					error: validation.error,
				};
			}

			// Create a meaningful filename
			const originalFilename = this.extractFilename( originalAttachment.source_url ) || 'image';
			const extension = this.getFileExtension( imageBlob.type ) || 'jpg';
			const timestamp = Date.now();
			const filename = `${ originalFilename }-ai-edited-${ timestamp }.${ extension }`;

			// Convert blob to File object
			const file = new File( [ imageBlob ], filename, {
				type: imageBlob.type,
			} );

			// Prepare upload options
			const uploadOptions = {
				allowedTypes: this.config.allowedTypes,
				maxUploadFileSize: this.config.maxUploadFileSize,
				maxUploadFiles: this.config.maxUploadFiles,
			};

			// Upload the image
			const uploadResult = await new Promise< any[] >( ( resolve, reject ) => {
				uploadMedia( {
					filesList: [ file ],
					onFileChange: ( attachments: any[] ) => {
						if ( attachments && attachments.length > 0 ) {
							resolve( attachments );
						}
					},
					onError: ( error: any ) => {
						reject( new Error( error.message || 'Upload failed' ) );
					},
					...uploadOptions,
				} );
			} );

			if ( ! uploadResult || uploadResult.length === 0 ) {
				throw new Error( 'No attachment returned from upload' );
			}

			const newAttachment = uploadResult[ 0 ];

			// Update the attachment metadata to link it to the original
			await this.updateAttachmentMetadata( newAttachment, originalAttachment, editPrompt );

			return {
				success: true,
				attachment: newAttachment,
				uploadId: newAttachment.id,
			};
		} catch ( error ) {
			console.error( 'Failed to upload AI-edited image:', error );

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Upload failed',
			};
		}
	}

	/**
	 * Validate image blob before upload
	 */
	private validateImageBlob( blob: Blob ): { valid: boolean; error?: string } {
		if ( ! blob || blob.size === 0 ) {
			return { valid: false, error: 'Invalid image data' };
		}

		if ( this.config.maxUploadFileSize && blob.size > this.config.maxUploadFileSize ) {
			return {
				valid: false,
				error: `Image too large (${ Math.round(
					blob.size / 1024 / 1024
				) }MB). Maximum size is ${ Math.round( this.config.maxUploadFileSize! / 1024 / 1024 ) }MB.`,
			};
		}

		if ( this.config.allowedTypes && ! this.config.allowedTypes.includes( blob.type ) ) {
			return {
				valid: false,
				error: `Unsupported image type: ${ blob.type }`,
			};
		}

		return { valid: true };
	}

	/**
	 * Extract filename from URL
	 */
	private extractFilename( url: string ): string | null {
		try {
			const urlObj = new URL( url );
			const pathname = urlObj.pathname;
			const filename = pathname.substring( pathname.lastIndexOf( '/' ) + 1 );
			const nameWithoutExt = filename.substring( 0, filename.lastIndexOf( '.' ) );
			return nameWithoutExt || 'image';
		} catch {
			return null;
		}
	}

	/**
	 * Get file extension from MIME type
	 */
	private getFileExtension( mimeType: string ): string | null {
		const mimeToExt: { [ key: string ]: string } = {
			'image/jpeg': 'jpg',
			'image/jpg': 'jpg',
			'image/png': 'png',
			'image/webp': 'webp',
			'image/gif': 'gif',
		};

		return mimeToExt[ mimeType ] || null;
	}

	/**
	 * Update attachment metadata to link to original image
	 */
	private async updateAttachmentMetadata(
		newAttachment: MediaItem,
		originalAttachment: MediaItem,
		editPrompt: string
	): Promise< void > {
		try {
			// This would typically make a REST API call to update the attachment
			// For now, we'll store the metadata in a way that can be retrieved later
			const metadata = {
				ai_edited: true,
				original_attachment_id: originalAttachment.id,
				edit_prompt: editPrompt,
				edit_timestamp: new Date().toISOString(),
				original_title: originalAttachment.title?.rendered || '',
			};

			// Update the attachment's meta or description with this information
			// This would need to be implemented based on the WordPress REST API structure
			console.log( 'AI Edit Metadata:', metadata );

			// TODO: Implement actual metadata update via REST API
			// await wp.media.attachment(newAttachment.id).save({
			//   meta: metadata
			// });
		} catch ( error ) {
			console.error( 'Failed to update attachment metadata:', error );
			// Non-critical error, don't fail the upload
		}
	}

	/**
	 * Create a download link for the image (fallback if upload fails)
	 */
	createDownloadLink( imageBlob: Blob, filename: string ): string {
		const url = URL.createObjectURL( imageBlob );
		const link = document.createElement( 'a' );
		link.href = url;
		link.download = filename;
		document.body.appendChild( link );
		link.click();
		document.body.removeChild( link );
		URL.revokeObjectURL( url );
		return url;
	}
}

/**
 * Default media uploader instance
 */
export const mediaUploader = new MediaUploaderService();

/**
 * Create media uploader with custom configuration
 */
export const createMediaUploader = ( config?: UploadConfig ): MediaUploaderService => {
	return new MediaUploaderService( config );
};

export default mediaUploader;
