import type { TailoredOutput } from './types.ts';

interface JsonSchema {
	type?: 'object' | 'array' | 'string';
	required?: string[];
	additionalProperties?: boolean;
	properties?: Record< string, JsonSchema >;
	items?: JsonSchema;
	enum?: string[];
	minLength?: number;
	maxLength?: number;
	minItems?: number;
	maxItems?: number;
}

/**
 * Inlined copy of contracts/agent-output-schema.json; a unit test asserts it
 * matches the committed contract, so drift is caught.
 */
export const AGENT_OUTPUT_SCHEMA: JsonSchema = {
	type: 'object',
	required: [ 'tasks', 'inferred', 'first_post_draft', 'about_page_draft' ],
	additionalProperties: false,
	properties: {
		tasks: {
			type: 'array',
			minItems: 6,
			maxItems: 6,
			items: {
				type: 'object',
				required: [ 'id', 'subtitle' ],
				additionalProperties: false,
				properties: {
					id: { type: 'string', minLength: 1 },
					subtitle: { type: 'string', minLength: 1, maxLength: 200 },
				},
			},
		},
		inferred: {
			type: 'object',
			required: [ 'goal' ],
			additionalProperties: false,
			properties: {
				goal: {
					type: 'string',
					enum: [ 'write', 'build', 'sell', 'newsletter', 'educate', 'portfolio' ],
				},
				inferred_goal: {
					type: 'string',
					enum: [ 'write', 'build', 'sell', 'newsletter', 'educate', 'portfolio' ],
				},
				brand_name: { type: 'string', maxLength: 80 },
				niche: { type: 'string', maxLength: 120 },
				theme_category: {
					type: 'string',
					enum: [
						'blog',
						'portfolio',
						'business',
						'store',
						'art-design',
						'about',
						'real-estate',
						'health-wellness',
						'authors-writers',
						'newsletter',
						'education',
						'magazine',
						'music',
						'restaurant',
						'travel-lifestyle',
						'fashion-beauty',
						'community-non-profit',
						'podcast',
						'entertainment',
					],
				},
				vibe: { type: 'string', maxLength: 120 },
				audience: { type: 'string', maxLength: 200 },
				tagline: { type: 'string', maxLength: 200 },
			},
		},
		first_post_draft: {
			type: 'object',
			required: [ 'title', 'paragraphs' ],
			additionalProperties: false,
			properties: {
				title: { type: 'string', minLength: 1, maxLength: 80 },
				subtitle: { type: 'string', maxLength: 120 },
				paragraphs: {
					type: 'array',
					minItems: 2,
					maxItems: 2,
					items: { type: 'string', minLength: 1, maxLength: 1200 },
				},
			},
		},
		about_page_draft: {
			type: 'object',
			required: [ 'title', 'paragraphs' ],
			additionalProperties: false,
			properties: {
				title: { type: 'string', minLength: 1, maxLength: 80 },
				paragraphs: {
					type: 'array',
					minItems: 2,
					maxItems: 3,
					items: { type: 'string', minLength: 1, maxLength: 1200 },
				},
			},
		},
		// Optional, and optional key by key: a page intro exists only for a page task the model chose.
		// Absent from `required` above rather than expressed as a conditional, which this validator
		// cannot represent — see the JsonSchema interface for the keywords it supports.
		page_intros: {
			type: 'object',
			additionalProperties: false,
			properties: {
				add_contact_page: { type: 'string', minLength: 1, maxLength: 200 },
				add_events_page: { type: 'string', minLength: 1, maxLength: 200 },
				add_video_page: { type: 'string', minLength: 1, maxLength: 200 },
				add_gallery_page: { type: 'string', minLength: 1, maxLength: 200 },
			},
		},
	},
};

/**
 * Validate a value against the subset of JSON Schema the agent output uses.
 * Returns human-readable errors; an empty list means valid.
 *
 * @param value  - The value to validate.
 * @param schema - The schema to validate against.
 * @param path   - Internal path accumulator for error messages.
 * @return The list of validation errors.
 */
export function validateAgainstSchema( value: unknown, schema: JsonSchema, path = '$' ): string[] {
	const errors: string[] = [];

	if ( schema.type === 'object' ) {
		if ( value === null || typeof value !== 'object' || Array.isArray( value ) ) {
			errors.push( `${ path }: expected object` );
			return errors;
		}
		const obj = value as Record< string, unknown >;
		const props = schema.properties ?? {};
		for ( const key of schema.required ?? [] ) {
			if ( ! ( key in obj ) ) {
				errors.push( `${ path }.${ key }: required, missing` );
			}
		}
		if ( schema.additionalProperties === false ) {
			for ( const key of Object.keys( obj ) ) {
				if ( ! ( key in props ) ) {
					errors.push( `${ path }.${ key }: additionalProperties:false but key present` );
				}
			}
		}
		for ( const [ key, subSchema ] of Object.entries( props ) ) {
			if ( key in obj ) {
				errors.push( ...validateAgainstSchema( obj[ key ], subSchema, `${ path }.${ key }` ) );
			}
		}
	} else if ( schema.type === 'array' ) {
		if ( ! Array.isArray( value ) ) {
			errors.push( `${ path }: expected array` );
			return errors;
		}
		if ( schema.minItems !== undefined && value.length < schema.minItems ) {
			errors.push( `${ path }: length ${ value.length } < minItems ${ schema.minItems }` );
		}
		if ( schema.maxItems !== undefined && value.length > schema.maxItems ) {
			errors.push( `${ path }: length ${ value.length } > maxItems ${ schema.maxItems }` );
		}
		if ( schema.items ) {
			value.forEach( ( item, i ) =>
				errors.push(
					...validateAgainstSchema( item, schema.items as JsonSchema, `${ path }[${ i }]` )
				)
			);
		}
	} else if ( schema.type === 'string' ) {
		if ( typeof value !== 'string' ) {
			errors.push( `${ path }: expected string` );
			return errors;
		}
		if ( schema.minLength !== undefined && value.length < schema.minLength ) {
			errors.push( `${ path }: length ${ value.length } < minLength ${ schema.minLength }` );
		}
		if ( schema.maxLength !== undefined && value.length > schema.maxLength ) {
			errors.push( `${ path }: length ${ value.length } > maxLength ${ schema.maxLength }` );
		}
		if ( schema.enum && ! schema.enum.includes( value ) ) {
			errors.push( `${ path }: "${ value }" not in enum [${ schema.enum.join( ', ' ) }]` );
		}
	}

	return errors;
}

/**
 * Parse the raw `content` string returned by jetpack-ai-query and validate it
 * against the agent output schema. Returns the typed output, or null if the JSON
 * is malformed or fails validation.
 *
 * @param content - The raw JSON string from `choices[0].message.content`.
 * @return The validated output, or null.
 */
export function parseAgentResponse( content: string ): TailoredOutput | null {
	let parsed: unknown;
	try {
		parsed = JSON.parse( content );
	} catch {
		return null;
	}

	if ( validateAgainstSchema( parsed, AGENT_OUTPUT_SCHEMA ).length > 0 ) {
		return null;
	}

	return parsed as TailoredOutput;
}
