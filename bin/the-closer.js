#!/usr/bin/env node

'use strict';

const fs     = require( 'fs' );
const github = require( 'github' );
const path   = require( 'path' );

function getFullPath( filename ) {
	return path.join( __dirname, '..', filename );
}

const config = require( '../config.json' );

config.message = fs.readFileSync( getFullPath( 'MESSAGE.md' ), 'utf8' );
config.firstIssueNumber = config.firstIssueNumber || 0;

if (
	! config.username ||
	! config.apiToken ||
	! config.owner ||
	! config.repo ||
	! config.message
) {
	throw new Exception( 'One or more required configuration values are missing.' );
}

const gh = new github( {
	version : '3.0.0',
} );

gh.authenticate( {
	type  : 'oauth',
	token : config.apiToken,
} );

let issuesProcessed = {};

try {
	issuesProcessed = require( '../processed.json' );
} catch ( err ) {
	// The file hasn't been created yet; no problem
}

function processIssuesPage( pageNumber, issuesToClose ) {
	console.log( 'Getting page %d of open issues...', pageNumber );
	gh.issues.getForRepo( {
		owner    : config.owner,
		repo     : config.repo,
		page     : pageNumber,
		per_page : 100,
	}, ( err, res ) => {
		if ( err ) {
			throw err;
		}
		const issues = res.filter( issue => ! issue.pull_request );
		const toCloseThisPage = issues.filter( issue => {
			if ( issue.number < config.firstIssueNumber ) {
				return false;
			}
			if ( issuesProcessed[ issue.number ] ) {
				console.log(
					'Ignoring issue %d ("%s")',
					issue.number,
					issue.title
				);
				return false;
			}
			return true;
		} );
		console.log(
			'Issues: %d; to close: %d',
			issues.length,
			toCloseThisPage.length
		);
		issuesToClose = issuesToClose.concat( toCloseThisPage );
		if ( gh.hasNextPage( res ) ) {
			processIssuesPage( pageNumber + 1, issuesToClose );
		} else {
			closeIssues( issuesToClose );
		}
	} );
}

function closeIssues( issues ) {
	if ( ! issues.length ) {
		return;
	}
	const issue = issues[ 0 ];
	let message = config.message;
	if ( issue.number % 1000 === 0 ) {
		message += '\n\n:tada: Congrats on issue number ' + issue.number + '!';
	}
	gh.issues.createComment( {
		owner  : config.owner,
		repo   : config.repo,
		number : issue.number,
		body   : message,
	}, ( err, res ) => {
		if ( err ) {
			throw err;
		}
		gh.issues.edit( {
			owner  : config.owner,
			repo   : config.repo,
			number : issue.number,
			state  : 'closed',
		}, ( err, res ) => {
			if ( err ) {
				throw err;
			}
			issuesProcessed[ issue.number ] = {
				title : issue.title,
				date  : new Date().toString(),
			};
			fs.writeFileSync(
				getFullPath( 'processed.json' ),
				JSON.stringify( issuesProcessed, null, 4 ) + '\n'
			);
			console.log(
				'Closed issue %d ("%s")',
				issue.number,
				issue.title
			);
			closeIssues( issues.slice( 1 ) );
		} );
	} );
}

processIssuesPage( 1, [] );
