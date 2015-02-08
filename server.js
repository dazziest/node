#!/bin/env node

var express = require('express');
var fs = require('fs');
var mongodb = require('mongodb');
var bodyParser = require('body-parser');

var App = function() {

    // Scope

    var self = this;

    // Setup

    var dbHost = process.env.OPENSHIFT_MONGODB_DB_HOST || "localhost";
    var dbPort = process.env.OPENSHIFT_MONGODB_DB_PORT || "27017";
    var appName = process.env.OPENSHIFT_APP_NAME || "node";

    self.dbServer = new mongodb.Server(dbHost, parseInt(dbPort));
    self.db = new mongodb.Db(appName, self.dbServer, {
        auto_reconnect: true
    });
    self.dbUser = process.env.OPENSHIFT_MONGODB_DB_USERNAME || "ziddan";
    self.dbPass = process.env.OPENSHIFT_MONGODB_DB_PASSWORD || "12345";

    self.ipaddr = process.env.OPENSHIFT_NODEJS_IP || "127.0.0.1";
    self.port = parseInt(process.env.OPENSHIFT_NODEJS_PORT) || 8080;

    if (typeof self.ipaddr === "undefined") {
        console.warn('No OPENSHIFT_NODEJS_IP environment variable');
    };

    // Web app logic

    self.routes = {};
    self.routes['node'] = function(req, res) {
        res.send('node is ok');
    };

    // self.routes['root'] = function(req, res) {
        // self.db.collection('names').find().toArray(function(err, names) {
        //     res.header("Content-Type:", "text/json");
        //     res.end(JSON.stringify(names));
        // });
    // };
    self.routes['root'] = function(req, res) {
        res.send('You have come to the park apps web service. All the web services are at /ws/node*. '+
          'For example /ws/node will return all the parks in the system in a JSON payload. '+
          'Thanks for stopping by and have a nice day');
    };

    self.routes['listAllData'] = function(req, res){
        self.db.collection('names').find().toArray(function(err, names) {
            res.header("Content-Type:", "text/json");
            res.end(JSON.stringify(names));
        });
    };

    // Webapp urls

    self.app = express();
    self.app.use(bodyParser.json());
    // self.app.use(express.methodOverride());
    // self.app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
    self.app.use(express.static('public', {
        dotfiles: 'ignore',
        etag: false,
        extensions: ['htm', 'html'],
        index: false,
        maxAge: '1d',
        redirect: false,
        setHeaders: function(res, path, stat) {
            res.set('x-timestamp', Date.now())
        }
    }));

    // self.app  = express.createServer();
    self.app.get('/ws/node', self.routes['listAllData']);
    self.app.get('/ws', self.routes['node']);
    self.app.get('/', self.routes['root']);


    // Logic to open a database connection. We are going to call this outside of app so it is available to all our functions inside.

    self.connectDb = function(callback) {
        self.db.open(function(err, db) {
            if (err) {
                throw err
            };
            self.db.authenticate(self.dbUser, self.dbPass, {
                authdb: "admin"
            }, function(err, res) {
                if (err) {
                    throw err
                };
                callback();
            });
        });
    };

    //starting the nodejs server with express

    self.startServer = function() {
        self.app.listen(self.port, self.ipaddr, function() {
            console.log('%s: Node server started on %s:%d ...', Date(Date.now()), self.ipaddr, self.port);
        });
    }

    // Destructors

    self.terminator = function(sig) {
        if (typeof sig === "string") {
            console.log('%s: Received %s - terminating Node server ...', Date(Date.now()), sig);
            process.exit(1);
        };
        console.log('%s: Node server stopped.', Date(Date.now()));
    };

    process.on('exit', function() {
        self.terminator();
    });

    self.terminatorSetup = function(element, index, array) {
        process.on(element, function() {
            self.terminator(element);
        });
    };

    ['SIGHUP', 'SIGINT', 'SIGQUIT', 'SIGILL', 'SIGTRAP', 'SIGABRT', 'SIGBUS', 'SIGFPE', 'SIGUSR1', 'SIGSEGV', 'SIGUSR2', 'SIGPIPE', 'SIGTERM'].forEach(self.terminatorSetup);

};

//make a new express app
var app = new App();

//call the connectDb function and pass in the start server command
app.connectDb(app.startServer);