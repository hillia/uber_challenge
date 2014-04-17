var Transit = Transit || {};

Transit.RouteConfigList = Backbone.Collection.extend({
  model: Transit.RouteConfig,

  parse: function(response) { return response.routes; },

  url: function() { return 'route_config/'; },
});