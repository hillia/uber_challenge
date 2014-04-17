var Transit = Transit || {};

Transit.RoutesNearbyView = Backbone.View.extend({
  initialize: function(opts) {
    this.listening = false;
    this.range = opts['range'];
  },

  render: function() {
    this.$el.html('<div class="route-config-list">' + Mustache.TEMPLATES.spinner + '</div> <div class="map">' + Mustache.TEMPLATES.spinner + '</div>');

    this.map_view = new Transit.MapView({ el: '.map', range: this.range });
    this.map_view.render();

    this.list_view = new Transit.RouteConfigListView({ el: '.route-config-list', model: this.model, range: this.range, map_view: this.map_view });
    this.list_view.render();
  }
});
