<script type="ts">
	import { slide } from 'svelte/transition';
	import type { ZodFormattedError } from 'zod';
	import FormError from './FormError.svelte';
	import { createEventDispatcher } from 'svelte';
	import { maybeStringify } from '@src/utils/maybeStringify';

	import { createPersistentStore } from '@src/utils/peristentStore';
	import type { LogEntry } from '@src/utils/Validator';
	import { EntryData } from '@src/utils/Validator';
	import type { Writable } from 'svelte/store';
	import { API } from '@src/Options';

	export let logEntry: LogEntry | false = false;
	const dispatch = createEventDispatcher();

	const data: Writable< EntryData > = createPersistentStore( 'jetpack_devtools_form', {
		url: '',
		body: '',
		headers: '',
		method: 'POST',
		transport: 'wp',
	} );

	$: if ( logEntry && logEntry.observer_outgoing ) {
		console.log( logEntry );
		$data = {
			url: logEntry.url,
			method: logEntry.observer_outgoing.args.method,
			body: maybeStringify( logEntry.observer_outgoing.args.body ),
			headers: maybeStringify( logEntry.observer_outgoing.args.headers ),
			transport: 'wp',
		};
	}

	let errors: ZodFormattedError< EntryData >;
	async function submit( formData: EntryData ) {
		// Populate transport according to whether authentication checkbox is checked.
		formData.transport = authenticate ? 'jetpack_connection' : 'wp';

		const data = EntryData.safeParse( formData );

		if ( ! data.success && 'error' in data ) {
			const formatted = data.error.format();
			errors = formatted;
			console.error( data.error );
			return;
		}

		await API.sendRequest( formData );
		dispatch( 'submit' );
	}

	let authenticate = false;
</script>

<div transition:slide class="new-request">
	<form on:submit|preventDefault={() => submit( $data )}>
		<h3>New Request</h3>
		<fieldset>
			<label class="control-label" for="method">Method</label>
			<div>
				<FormError error={errors?.method} />
				<select name="method" id="method" bind:value={$data.method}>
					<option value="POST">POST</option>
					<option value="GET">GET</option>
					<option value="PUT">PUT</option>
					<option value="DELETE">DELETE</option>
					<option value="PATCH">PATCH</option>
				</select>
			</div>

			<!-- Text input-->
			<section>
				<label class="control-label" for="apiurl">URL</label>
				<div>
					<FormError error={errors?.url} />
					<input bind:value={$data.url} id="apiurl" name="apiurl" type="text" />
				</div>
			</section>

			<!-- Body -->
			<section>
				<label for="body">Body</label>
				<div>
					<FormError error={errors?.body} />
					<textarea bind:value={$data.body} class="form-control" id="body" name="body" />
				</div>
			</section>

			<!-- Headers -->
			<section>
				<label for="body">Headers</label>
				<div>
					<FormError error={errors?.headers} />
					<textarea bind:value={$data.headers} class="form-control" id="body" name="body" />
				</div>
			</section>

			<div>
				<div class="control-label">Jetpack Authentication</div>
				<div class="hint">
					Optional: Should the request be signed with Jetpack Connection credentials?
				</div>

				<label for="authenticate">
					<input
						name="authenticate"
						id="authenticate"
						type="checkbox"
						bind:checked={authenticate}
					/>Authenticate with Jetpack Connection</label
				>
			</div>
			<button class="ji-button">Send</button>
		</fieldset>
	</form>
</div>

<style type="scss">
	.new-request {
		background-color: var( --gray_0 );
	}

	form {
		padding: 20px 40px;
	}

	fieldset section {
		margin-bottom: 1.4rem;
	}

	label[for='authenticate'] {
		margin-bottom: 10px;
		margin-top: 10px;
		display: block;
	}

	.control-label {
		margin-bottom: 5px;
		text-transform: uppercase;
		font-size: 0.7rem;
		display: block;
		color: #999;
		font-weight: 600;
	}

	textarea {
		padding: 1rem;
		min-height: 100px;
	}

	input {
		padding: 0.25rem 1rem;
	}

	textarea,
	input:not( [type='checkbox'] ),
	select {
		width: 100%;
		margin-bottom: 0.5rem;
	}

	input[type='checkbox'] {
		margin-right: 0.5rem;
		display: inline-block;
	}
</style>
