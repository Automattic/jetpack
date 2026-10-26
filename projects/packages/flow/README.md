# Flow

If-this-then-that automations for Jetpack, MailPoet, CRM and WooCommerce.

- **Triggers** (`src/class-catalog.php`): form submissions, newsletter subscriptions, payments, WooCommerce orders, new posts and comments, new users, Monitor and Stats events, and a daily schedule.
- **Actions**: email any user, webhooks, POST to URL, MailPoet, Jetpack newsletter, Social, Podcast, Google Sheets, CRM contacts, draft posts. The integrations under `src/integrations/` are copied from the Jetpack Forms package.
- **Dashboard**: a WP Build page (`routes/home`) where customers describe flows in plain language (core AI client, falling back to Jetpack AI) or drag cards together.
- **Inbound events**: Monitor and Stats triggers have no local WordPress hook, so an external service POSTs to `/wp-json/jetpack-flow/v1/events/<trigger>?token=…` (URL shown on the dashboard).

Add your own with the `jetpack_flow_triggers` and `jetpack_flow_actions` filters, plus `jetpack_flow_run_action_<id>`.

## Usage

Packages are built with `jp build packages/flow`; the plugin lives in `projects/plugins/flow`.
