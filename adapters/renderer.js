var url = require('url'),
  Hoek = require('hoek'),
  Boom = require('boom');

var humans = [
  'iegor'
];

exports.register = function(server, options, next) {
  var database = require('./database')();

  server.ext('onPreHandler', function(request, reply) {
    if (request.params.room) {
      request.roomName = request.params.room
    }

    request.database = database;

    if (request.auth && request.auth.credentials && !request.path.match(/static\//)) {
      request.loggedInUser = request.auth.credentials;
      completePreHandler();
    } else {
      completePreHandler();
    }

    function completePreHandler() {

      if (request.method !== "post") {
        return reply.continue();
      }

      if (request.payload.honey && request.payload.honey.length) {
        return reply(Boom.badRequest(request.path));
      }

      delete request.payload.honey;
      return reply.continue();
    }
  });

  server.ext('onPreResponse', function(request, reply) {
    var options = {
      correlationID: request.id,
      stamp: request.server.stamp,
      devEnv: (process.env.NODE_ENV === 'dev'),
      url: process.env.CANONICAL_HOST,
      page: request.url.pathname,
    };

    if (request.response && request.response.variety && request.response.variety.match(/view|plain/)) {
      if (process.env.CANONICAL_HOST) {
        if (request.url.query.page || request.url.query.q) {
          options.canonicalURL = url.resolve(process.env.CANONICAL_HOST, request.url.path);
        } else {
          options.canonicalURL = url.resolve(process.env.CANONICAL_HOST, request.url.pathname);
        }
      }
    }


    switch (request.response.variety) {
      case "view":
        request.response.source.context = Hoek.applyToDefaults(options, request.response.source.context);
        request.response.source.context.user = request.loggedInUser;
        break;
      case "plain":
        if (typeof (request.response.source) === "object") {
          // request.response.source = Hoek.applyToDefaults(options, request.response.source);
        }
        break;
    }

    // Allow npm humans to view JSON context for any page
    // by adding a `?json` query parameter to the URL
    if ('json' in request.query &&
      Hoek.reach(request, 'response.source.context') &&
      (process.env.NODE_ENV === "dev" || Hoek.reach(request, "loggedInUser.username") in humans)
    ) {
      if (request.query.json.length > 1) {
        // deep reference: ?json=profile.packages
        return reply(Hoek.reach(request.response.source.context, request.query.json));
      } else {
        // the whole enchilada: ?json
        return reply(request.response.source.context);
      }
    }

    return reply.continue();
  });

  return next();
};

exports.register.attributes = {
  name: 'renderer',
  version: '1.0.0'
};