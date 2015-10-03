var _ = require("lodash");
var publicRoutes = require('./public');
var authRoutes = [];

var routes = publicRoutes.concat(authRoutes).reduce(function(routes, route) {
  // If route defines an array of paths,
  // register each as an individual route
  if (route.paths) {
    route.paths.forEach(function(path) {
      var r = _.cloneDeep(route);
      delete r.paths;
      r.path = path;
      routes.push(r);
    });
  } else {
    routes.push(route);
  }

  return routes;
}, []);

module.exports = routes;