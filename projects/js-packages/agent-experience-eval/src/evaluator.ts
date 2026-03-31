import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { discoverFiles, type DiscoveredFile, type DiscoveryOptions } from './discovery.js';
import { buildPrompt } from './prompt.js';
import { evaluationResultSchema, type EvaluationResult } from './schema.js';
import { validateCurrency, type ValidationResult } from './validator.js';

export interface EvaluateOptions {
	/** Path to the repository root. */
	repoRoot: string;
	/** Anthropic API key. Defaults to ANTHROPIC_API_KEY env var. */
	apiKey?: string;
	/** Claude model to use. Default: "claude-sonnet-4-6" */
	model?: string;
	/** Max output tokens. Default: 16000 */
	maxTokens?: number;
	/** Control file discovery behavior. */
	discoveryOptions?: DiscoveryOptions;
}

export interface EvaluateMetadata {
	result: EvaluationResult;
	discovery: DiscoveredFile[];
	validation: ValidationResult;
	promptTruncated: boolean;
	usage: {
		inputTokens: number;
		outputTokens: number;
	};
	model: string;
	requestId?: string;
}

/**
 * Runs the full evaluation pipeline: discover files, validate currency, call Claude API.
 *
 * @param options - Evaluation options (repo root, API key, model, etc.).
 * @return Evaluation metadata including the result, discovered files, validation, and usage.
 */
export async function evaluate( options: EvaluateOptions ): Promise< EvaluateMetadata > {
	const {
		repoRoot,
		apiKey,
		model = 'claude-sonnet-4-6',
		maxTokens = 16000,
		discoveryOptions,
	} = options;

	// 1. Discover AI instruction files
	const files = await discoverFiles( repoRoot, discoveryOptions );

	// 2. Validate currency (check referenced paths/commands)
	const validation = await validateCurrency( repoRoot, files );

	// 3. Build prompt with file contents and validation results
	const { prompt, truncated } = buildPrompt( files, validation );

	// 4. Call Claude API with structured output
	const client = new Anthropic( apiKey ? { apiKey } : undefined );

	const response = await client.messages.parse( {
		model,
		max_tokens: maxTokens,
		messages: [ { role: 'user', content: prompt } ],
		output_config: {
			format: zodOutputFormat( evaluationResultSchema ),
		},
	} );

	if ( ! response.parsed_output ) {
		throw new Error( `Evaluation failed. Stop reason: ${ response.stop_reason }` );
	}

	return {
		result: response.parsed_output,
		discovery: files,
		validation,
		promptTruncated: truncated,
		usage: {
			inputTokens: response.usage.input_tokens,
			outputTokens: response.usage.output_tokens,
		},
		model,
		requestId: ( response as unknown as Record< string, unknown > ).request_id as
			| string
			| undefined,
	};
}
