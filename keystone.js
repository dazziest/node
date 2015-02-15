// Simulate config options from your production environment by
// customising the .env file in your project's root folder.
require('dotenv').load();

// Require keystone
var keystone = require('keystone'),
	swig = require('swig');

// Disable swig's bulit-in template caching, express handles it
swig.setDefaults({ cache: false });

// Initialise Keystone with your project's configuration.
// See http://keystonejs.com/guide/config for available options
// and documentation.

var port = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080;
var host = process.env.OPENSHIFT_NODEJS_IP || "localhost";
var dbHost = process.env.OPENSHIFT_MONGODB_DB_HOST || "localhost";
var dbPort = process.env.OPENSHIFT_MONGODB_DB_PORT || "27017";
var appName = process.env.OPENSHIFT_APP_NAME || "node";

var connectionString = null;
if(process.env.OPENSHIFT_MONGODB_DB_USERNAME && process.env.OPENSHIFT_MONGODB_DB_PASSWORD){
	connectionString = process.env.OPENSHIFT_MONGODB_DB_USERNAME + ":" +  process.env.OPENSHIFT_MONGODB_DB_PASSWORD + "@" + dbHost + '/' + appName;
}else{
	connectionString = "mongodb://localhost:27017"
}

keystone.init({

	'name': appName,
	'brand': 'Node',
	
	'sass': 'public',
	'static': 'public',
	'favicon': 'public/favicon.ico',
	'views': 'templates/views',
	'view engine': 'swig',
	
	'custom engine': swig.renderFile,

	'port': port,
	'host': host,
	'mongo': connectionString,
	
	'auto update': true,
	'session': true,
	'auth': true,
	'user model': 'User',
	'cookie secret': '^#55?E`0--1_b>aJ2]Z=7KxIg`dJFsPL|t"MG~87lPIzdN<QK[fX3T|3,>th3f3=',


});

// Load your project's Models

keystone.import('models');

// Setup common locals for your templates. The following are required for the
// bundled templates and layouts. Any runtime locals (that should be set uniquely
// for each request) should be added to ./routes/middleware.js

keystone.set('locals', {
	_: require('underscore'),
	env: keystone.get('env'),
	utils: keystone.utils,
	editable: keystone.content.editable
});

// Load your project's Routes

keystone.set('routes', require('./routes'));

// Setup common locals for your emails. The following are required by Keystone's
// default email templates, you may remove them if you're using your own.

// Configure the navigation bar in Keystone's Admin UI

keystone.set('nav', {
	'posts': ['posts', 'post-categories'],
	'galleries': 'galleries',
	'enquiries': 'enquiries',
	'users': 'users'
});

// Start Keystone to connect to your database and initialise the web server

keystone.start();
