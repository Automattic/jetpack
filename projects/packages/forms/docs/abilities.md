# Forms Abilities

`Forms_Abilities` (`src/abilities/class-forms-abilities.php`) registers Jetpack Forms abilities with the [WordPress Abilities API](https://make.wordpress.org/core/), making form and response management available to AI agents and other ability consumers.

## Registration Flow

`Forms_Abilities::init()` hooks registration into the Abilities API lifecycle:

- **Category**: registers the `jetpack-forms` category on `wp_abilities_api_categories_init` via `register_category()` (or immediately if that action already fired).
- **Abilities**: registers all abilities on `wp_abilities_api_init` via `register_abilities()` (or immediately if that action already fired).

`register_abilities()` calls one `register_*_ability()` method per ability. Each of these calls `wp_register_ability()` with a label, description, JSON Schema `input_schema`, an `execute_callback`, a `permission_callback`, and `meta` annotations. Both `wp_register_ability_category()` and `wp_register_ability()` are guarded with `function_exists()` checks so the class is a no-op on WordPress versions that predate the Abilities API.

## Permission Model

Every ability shares the same permission callback:

```php
public static function can_edit_pages() {
	return current_user_can( 'edit_pages' );
}
```

There is currently no per-ability permission distinction (e.g. read-only abilities don't require a lower capability than destructive ones).

## Registered Abilities

All abilities are namespaced under the `jetpack-forms` category.

### `jetpack-forms/list-forms`

List forms with admin-level detail (response counts, status, edit URLs). Read-only, idempotent.

| Field | Type | Notes |
|---|---|---|
| `page` | integer | Default `1`. |
| `per_page` | integer | Default `10`, max 100. |
| `search` | string | Filter by form title. |
| `status` | string | One of `publish`, `draft`, `trash`. |

### `jetpack-forms/get-form`

Get a single form's full structure, including field definitions extracted from block content. Read-only, idempotent.

| Field | Type | Notes |
|---|---|---|
| `id` | integer | **Required.** The form ID. |

### `jetpack-forms/create-form`

Create a new form. Not read-only, not idempotent.

| Field | Type | Notes |
|---|---|---|
| `title` | string | **Required.** |
| `content` | string | Block content; defaults to an empty form with a submit button if omitted. |
| `status` | string | One of `publish`, `draft`. Default `publish`. |

### `jetpack-forms/delete-form`

Move a form to the trash (not a permanent delete). Destructive, idempotent.

| Field | Type | Notes |
|---|---|---|
| `id` | integer | **Required.** The form ID to delete. |

### `jetpack-forms/get-responses`

List or search form responses. Read-only, idempotent.

| Field | Type | Notes |
|---|---|---|
| `ids` | integer[] | Fetch specific responses by ID. |
| `page` | integer | Default `1`. |
| `per_page` | integer | Default `10`, max 100. |
| `parent` | integer[] | Filter by embedding page/post ID. |
| `status` | string | One of `publish`, `draft`, `spam`, `trash`. |
| `is_unread` | boolean | `true` for unread only, `false` for read only. |
| `search` | string | Search response content and sender info. |
| `before` / `after` | string | ISO 8601 date-time bounds. |

### `jetpack-forms/update-response`

Update a single response's status and/or read state. Not read-only, idempotent.

| Field | Type | Notes |
|---|---|---|
| `id` | integer | **Required.** The response ID. |
| `status` | string | One of `publish` (restore), `draft`, `spam`, `trash`. |
| `is_unread` | boolean | `false` marks read, `true` marks unread. |

### `jetpack-forms/bulk-update-responses`

Mark multiple responses as spam or not-spam in one call. Not read-only, idempotent.

| Field | Type | Notes |
|---|---|---|
| `action` | string | **Required.** One of `mark_as_spam`, `mark_as_not_spam`. |
| `ids` | integer[] | **Required.** Response IDs to update. |

### `jetpack-forms/get-status-counts`

Get response counts grouped by status (inbox, spam, trash) for dashboard stats. Read-only, idempotent.

| Field | Type | Notes |
|---|---|---|
| `search` | string | Only count matching responses. |
| `parent` | integer | Only count responses from a specific page/post. |
| `before` / `after` | string | ISO 8601 date-time bounds. |
| `is_unread` | boolean | Restrict to unread or read only. |

## REST Delegation Pattern

Ability callbacks do not implement business logic directly. Instead, they build an internal `WP_REST_Request` and dispatch it through the private `dispatch()` helper:

```php
private static function dispatch( $request ) {
	$response = rest_do_request( $request );

	if ( $response->is_error() ) {
		return $response->as_error();
	}

	return $response->get_data();
}
```

This means every ability inherits the corresponding REST endpoint's argument sanitization, permission checks, and action hooks for free, rather than duplicating that logic in the ability layer. The callbacks map to these endpoints:

| Ability | REST endpoint(s) |
|---|---|
| `list-forms` | `GET /wp/v2/jetpack-forms` (with `jetpack_forms_context=dashboard`) |
| `get-form` | `GET /wp/v2/jetpack-forms/{id}` (with `context=edit`) |
| `create-form` | `POST /wp/v2/jetpack-forms` |
| `delete-form` | `DELETE /wp/v2/jetpack-forms/{id}` |
| `get-responses` | `GET /wp/v2/feedback` |
| `update-response` | `POST /wp/v2/feedback/{id}` and/or `POST /wp/v2/feedback/{id}/read` |
| `bulk-update-responses` | `POST /wp/v2/feedback/bulk_actions` |
| `get-status-counts` | `GET /wp/v2/feedback/counts` |

Some callbacks reshape the raw REST response for AI consumption rather than returning it verbatim:

- `list_forms()` trims each form down to `id`, `title`, `status`, `entries_count`, `edit_url`, `date`, and `modified`.
- `get_form()` enriches the REST response with `fields`, extracted from the form post's block content via `extract_fields_from_post()` / `extract_fields_from_blocks()` (recursively walking `jetpack/field-*` blocks for `label`, `type`, `required`, `options`, and `placeholder`).
- `update_form_response()` may dispatch up to two REST requests (one for `status`, one for `is_unread`) and merges their results.

## Ability Meta

Every ability sets `meta.show_in_rest => true` and a `meta.annotations` block with `readonly`, `destructive`, and `idempotent` flags, summarized above per ability. These annotations follow the Abilities API convention for describing side effects to ability consumers without requiring them to inspect the callback implementation.
