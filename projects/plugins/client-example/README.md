# What this plugin is for

In order to use some functionality provided by WordPress.com and used by Jetpack, a connection between the site and WordPress.com is needed. The package providing connection capability is called jetpack-connection, and this plugin illustrates what needs to be done to use it.

# Building and Developing the plugin

## Making your development site publicly available

### Using ngrok

This plugin, like Jetpack itself, requires that your site has a public address on the internet. Assuming you are developing on a laptop or desktop machine (rather than a server with its own existing public address), this means you need a tool like `ngrok` in order to "tunnel" from a public address (e.g. mysubdomain.ngrok.io) to your development machine.

On my laptop, I create a tunnel to my development site (running on Local by Flywheel) like this:

```bash
$ ngrok http -subdomain=goldsounds3 80
```

My site also needs to have its public URL set to http://goldsounds3.ngrok.io

### Using a standalone server

If you have an existing WordPress site that's accessible to the outside world, it's not necessary to use any tunneling software, just put the plugin code into your `wp-content/plugins` folder.

## Building the plugin

Check out the code into your plugins directory:

```bash
$ # TODO: This needs to use a new Monorepo approach
$ # cd my-site/wp-content/plugins
$ # git clone git@github.com:Automattic/client-example.git
```

Install the dependencies:

```bash
$ composer install
```

Now activate the plugin in wp-admin of your development site.

## Troubleshooting / FAQ

### The Jetpack server was unable to communicate with your site

When you try to connect, you might see this error:

```
The Jetpack server was unable to communicate with your site http://goldsounds3.ngrok.io [HTTP 404]. Ask your web host if they allow connections from WordPress.com. If you need further assistance, contact Jetpack Support: http://jetpack.com/support/
```

This means you don't have a correct public address that allows WordPress.com servers to access your machine. Double check your tunnelling configuration, and if possible confirm your site is publicly accessible by pinging or using `curl` from the shell of another computer on the internet.

