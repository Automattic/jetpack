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
			// The value itself is left out: these messages end up in the `tailored` Logstash record.
			errors.push( `${ path }: not in enum` );
		}
	}

	return errors;
}

/** At most this many reasons per failed attempt reach the server. */
export const MAX_REASONS_PER_ATTEMPT = 3;

/** Each reason is cut to this many characters. */
const MAX_REASON_LENGTH = 120;

/**
 * The outcome of parsing one model reply: the validated output, or null plus why it was rejected.
 *
 * The reasons name only paths and rules (`first_post_draft.subtitle: expected string`), never a
 * value, because they are logged.
 */
export type ParseResult =
	{ output: TailoredOutput; errors: [] } | { output: null; errors: string[] };

/**
 * Remove optional keys the model wrote as null or as an empty string, at any depth of the schema.
 *
 * Models often spell "leave this out" as null or "". The schema rejects null for every field and
 * "" for the fields with a minLength, so without this an output that is otherwise complete would
 * fail into a retry over a field nothing needs. Required keys are left alone, so a null required
 * field still fails validation.
 *
 * @param value  - The parsed value, mutated in place.
 * @param schema - The schema node `value` is validated against.
 */
function dropEmptyOptionalKeys( value: unknown, schema: JsonSchema ): void {
	if ( schema.type === 'array' && schema.items && Array.isArray( value ) ) {
		value.forEach( item => dropEmptyOptionalKeys( item, schema.items as JsonSchema ) );
		return;
	}
	if (
		schema.type !== 'object' ||
		! value ||
		typeof value !== 'object' ||
		Array.isArray( value )
	) {
		return;
	}
	const record = value as Record< string, unknown >;
	for ( const [ key, subSchema ] of Object.entries( schema.properties ?? {} ) ) {
		if ( ! ( key in record ) ) {
			continue;
		}
		if (
			! schema.required?.includes( key ) &&
			( record[ key ] === null || record[ key ] === '' )
		) {
			delete record[ key ];
			continue;
		}
		dropEmptyOptionalKeys( record[ key ], subSchema );
	}
}

/**
 * Remove `page_intros` keys that name no known page task. An intro for a task the client cannot
 * place would never render, so it is not worth discarding the whole output over.
 *
 * @param parsed - The parsed model output, mutated in place.
 */
function dropUnknownPageIntros( parsed: unknown ): void {
	const intros = ( parsed as { page_intros?: unknown } | null )?.page_intros;
	if ( ! intros || typeof intros !== 'object' || Array.isArray( intros ) ) {
		return;
	}
	const known = AGENT_OUTPUT_SCHEMA.properties?.page_intros?.properties ?? {};
	for ( const key of Object.keys( intros ) ) {
		if ( ! ( key in known ) ) {
			delete ( intros as Record< string, unknown > )[ key ];
		}
	}
}

/**
 * Remove optional `inferred` fields that fail their schema, so a field nothing requires can't
 * discard an otherwise valid output.
 *
 * @param parsed - The parsed model output, mutated in place.
 */
function dropInvalidOptionalInferred( parsed: unknown ): void {
	const inferred = ( parsed as { inferred?: unknown } | null )?.inferred;
	if ( ! inferred || typeof inferred !== 'object' ) {
		return;
	}
	const record = inferred as Record< string, unknown >;
	const inferredSchema = AGENT_OUTPUT_SCHEMA.properties?.inferred;
	for ( const [ field, fieldSchema ] of Object.entries( inferredSchema?.properties ?? {} ) ) {
		if (
			field in record &&
			! inferredSchema?.required?.includes( field ) &&
			validateAgainstSchema( record[ field ], fieldSchema ).length > 0
		) {
			delete record[ field ];
		}
	}
}

/**
 * Turn a validator message into a loggable reason: drop the root `$.` and anything outside a
 * conservative character set, and cap the length. Paths can carry a key the model invented, so
 * this keeps even those to plain identifiers.
 *
 * @param message - A validateAgainstSchema message.
 * @return The reason.
 */
function toReason( message: string ): string {
	return message
		.replace( /^\$\./, '' )
		.replace( /[^A-Za-z0-9_.$[\]:<>= -]/g, '' )
		.slice( 0, MAX_REASON_LENGTH );
}

/**
 * Parse the raw `content` string returned by jetpack-ai-query and validate it against the agent
 * output schema, after removing the optional fields that would fail it for no good reason.
 *
 * @param content - The raw JSON string from `choices[0].message.content`.
 * @return The validated output, or null plus the reasons it was rejected.
 */
export function parseAgentResponse( content: string ): ParseResult {
	let parsed: unknown;
	try {
		parsed = JSON.parse( content );
	} catch {
		// Not the SyntaxError message: V8 quotes the offending text in it.
		return { output: null, errors: [ '$: invalid JSON' ] };
	}

	dropEmptyOptionalKeys( parsed, AGENT_OUTPUT_SCHEMA );
	dropUnknownPageIntros( parsed );
	dropInvalidOptionalInferred( parsed );

	const errors = validateAgainstSchema( parsed, AGENT_OUTPUT_SCHEMA );
	if ( errors.length > 0 ) {
		return { output: null, errors: errors.slice( 0, MAX_REASONS_PER_ATTEMPT ).map( toReason ) };
	}

	return { output: parsed as TailoredOutput, errors: [] };
}
