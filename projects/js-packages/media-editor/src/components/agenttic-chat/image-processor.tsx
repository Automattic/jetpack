/**
 * AI Image Processing Service
 *
 * Handles communication with AI image generation/editing services
 * for the media editor. Processes editing prompts and generates
 * modified images.
 */

/**
 * Interface for image editing requests
 */
export interface ImageEditRequest {
	prompt: string;
	imageUrl: string;
	attachmentId: number;
	options?: {
		strength?: number; // 0-1, how much to change the image
		style?: string; // Style guidance for the edit
		preserveAspectRatio?: boolean;
	};
}

/**
 * Interface for image editing responses
 */
export interface ImageEditResponse {
	success: boolean;
	imageData?: string; // Base64 encoded image data
	imageUrl?: string; // Direct URL to the generated image
	error?: string;
	metadata?: {
		prompt: string;
		processingTime: number;
		originalImageId: number;
	};
}

/**
 * AI Image Processing Service Class
 */
class ImageProcessorService {
	private readonly apiEndpoint: string;
	private readonly authToken: string;

	constructor( authToken: string ) {
		// Use WordPress.com AI API endpoint
		this.apiEndpoint = 'https://public-api.wordpress.com/wpcom/v2/ai/image-edit';
		this.authToken = authToken;
	}

	/**
	 * Edit an image using AI based on a text prompt
	 */
	async editImage( request: ImageEditRequest ): Promise< ImageEditResponse > {
		const startTime = Date.now();

		try {
			// Prepare the request payload
			const payload = {
				prompt: request.prompt,
				image_url: request.imageUrl,
				attachment_id: request.attachmentId,
				strength: request.options?.strength || 0.7,
				style: request.options?.style || 'natural',
				preserve_aspect_ratio: request.options?.preserveAspectRatio !== false,
			};

			// Make the API request
			const response = await fetch( this.apiEndpoint, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${ this.authToken }`,
				},
				body: JSON.stringify( payload ),
			} );

			if ( ! response.ok ) {
				throw new Error( `API request failed: ${ response.status } ${ response.statusText }` );
			}

			const data = await response.json();

			// Handle the response
			if ( data.error ) {
				return {
					success: false,
					error: data.error,
				};
			}

			return {
				success: true,
				imageData: data.image_data, // Base64 encoded image
				imageUrl: data.image_url, // Direct URL if available
				metadata: {
					prompt: request.prompt,
					processingTime: Date.now() - startTime,
					originalImageId: request.attachmentId,
				},
			};
		} catch ( error ) {
			console.error( 'Image editing failed:', error );

			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error occurred',
				metadata: {
					prompt: request.prompt,
					processingTime: Date.now() - startTime,
					originalImageId: request.attachmentId,
				},
			};
		}
	}

	/**
	 * Convert base64 image data to blob
	 */
	base64ToBlob( base64Data: string, mimeType: string = 'image/jpeg' ): Blob {
		// Remove data URL prefix if present
		const base64 = base64Data.replace( /^data:image\/[a-z]+;base64,/, '' );

		// Convert base64 to binary
		const byteCharacters = atob( base64 );
		const byteNumbers = new Array( byteCharacters.length );

		for ( let i = 0; i < byteCharacters.length; i++ ) {
			byteNumbers[ i ] = byteCharacters.charCodeAt( i );
		}

		const byteArray = new Uint8Array( byteNumbers );
		return new Blob( [ byteArray ], { type: mimeType } );
	}

	/**
	 * Validate image editing request
	 */
	validateRequest( request: ImageEditRequest ): {
		valid: boolean;
		error?: string;
	} {
		if ( ! request.prompt || request.prompt.trim().length === 0 ) {
			return { valid: false, error: 'Prompt is required' };
		}

		if ( ! request.imageUrl || ! request.imageUrl.startsWith( 'http' ) ) {
			return { valid: false, error: 'Valid image URL is required' };
		}

		if ( ! request.attachmentId || request.attachmentId <= 0 ) {
			return { valid: false, error: 'Valid attachment ID is required' };
		}

		if (
			request.options?.strength &&
			( request.options.strength < 0 || request.options.strength > 1 )
		) {
			return { valid: false, error: 'Strength must be between 0 and 1' };
		}

		return { valid: true };
	}
}

/**
 * Create image processor service instance
 */
export const createImageProcessor = ( authToken: string ): ImageProcessorService => {
	return new ImageProcessorService( authToken );
};

/**
 * Hardcoded token for development (same as in auth.tsx)
 */
const HARDCODED_TOKEN = '';

/**
 * Default image processor instance
 */
export const imageProcessor = createImageProcessor( HARDCODED_TOKEN );

export default imageProcessor;
