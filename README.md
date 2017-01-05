# The Closer

This is a bot that automatically closes GitHub issues.  You can specify a
minimum issue number if you want to leave older issues open.

Also, the bot will write the issues it closes to a JSON file so that you can
re-open them without further interference.

## Installation

First, make sure you have Node.js installed (tested on version 5.12.0).

Then:

```
git clone https://github.com/nylen/the-closer.git
cd the-closer
cp sample-config.json config.json
```

Then fill in the values in `config.json`.

## Configuration

- `username`: Your GitHub username.
- `apiToken`: Your [GitHub API token](https://github.com/settings/tokens).
- `owner`: The owner of the repository where you want to close issues.
- `owner`: The name of the repository where you want to close issues.
- `firstIssueNumber`: Close issues with this issue number or higher.

For the message to use when closing an issue, the plugin will read a file
called `MESSAGE.md` in the same directory as the config file.

## Usage

```sh
node bin/the-closer.js
```

I recommend setting this to run using a cron job, e.g. every 5 minutes.
