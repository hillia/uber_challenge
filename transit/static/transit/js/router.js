var Transit = Transit || {};

Transit.Router = Backbone.Router.extend({
  routes: {
    "":                         "index",
    "routes/nearby/:range":     "routes_nearby"
  },

  index: function() {
    this.indexView = new Transit.IndexView({ el: '#main-view' });
    this.indexView.render();
  },

  routes_nearby: function(range) {
    var route_list = new Transit.RouteConfigList();
    route_list.fetch();
    this.nearbyRoutesView = new Transit.RoutesNearbyView({ el: '#main-view', model: route_list, range: parseFloat(range) });
    this.nearbyRoutesView.render();
  }
});

Transit.app = new Transit.Router();
