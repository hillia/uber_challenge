var Transit = Transit || {};

Transit.RouteConfigListView = Backbone.View.extend({
  loading: false,

  events: {
    'mouseover .route': 'map_route'
  },

  initialize: function(options) {
    this.range = options['range'];
    this.map_view = options['map_view'];
  },

  map_route: function(evt) {
    $route = $(evt.currentTarget);
    var route_config = this.model.findWhere({ tag: String($route.data('tag')) });

    $('.route').removeClass('selected');
    $route.addClass('selected');

    this.map_view.draw_route(route_config);
  },

  render_nearby_routes: function() {
    this.$el.html('');
    _.each(this.model.models, function(route_config) {
      if (route_config.is_within(this.range, Transit.Coordinates.current)) {
        this.render_route(route_config);
      }
    }, this);
  },

  render_route: function(route_config) {
    this.$el.append(Mustache.render(Mustache.TEMPLATES.route_config_list_item, {
      tag: route_config.get('tag'),
      nearest_stop: route_config.nearest_stop(Transit.Coordinates.current)['title'],
      title: route_config.get('title'),
      color: route_config.get('color')
    }));
  },

  render: function() {
    if (Transit.Coordinates.ready && this.model.length > 0) {
      this.loading = false;
      this.render_nearby_routes();
    } else if (!this.loading) {
      this.loading = true;
      Transit.Coordinates.on('ready', this.render, this);
      this.model.on('add', this.render, this);
    }
  }
});