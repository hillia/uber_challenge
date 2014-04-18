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

  fetch_predictions: function() {
    if (this.predictionsList == undefined) {
      var stops = _.map(this.nearby_routes(), function(route_config) {
        return {
          route: route_config.get('tag'),
          stop: route_config.nearest_stop(Transit.Coordinates.current)['tag']
        }
      }, this);
      this.predictionsList = new Transit.PredictionsList({stops: stops});
      this.predictionsList.on('add', this.render_prediction, this);

      // Refresh routes every minute.
      this.predictionsInterval = setInterval(_.bind(this.fetch_predictions, this), 55000);
    }

    this.predictionsList.fetch();
  },

  // TODO: This should be a PredictionsView.
  render_prediction: function(model) {
    var $arrival_time = this.$el.find('.route[data-tag=' + model.get('routeTag') + '] .route-predictions-minutes');
    if (model.has('directions')) {
      // TODO: Show all directions. Not all stops have only 1 direction.
      prediction_times = _.map(model.get('directions')[0]['predictions'], function(prediction) {
        return prediction['minutes'] + 'mins';
      });
      $arrival_time.html(prediction_times.join(', '));
    } else {
      $arrival_time.html("<div class='error'>NOT RUNNING</div>");
    }
  },

  nearby_routes: function() {
    if (this._nearby_routes == undefined || this._nearby_routes.length == 0) {
      this._nearby_routes = _.filter(this.model.models, function(route_config) {
        return route_config.is_within(this.range, Transit.Coordinates.current)
      }, this);
    }
    return this._nearby_routes;
  },

  render_nearby_routes: function() {
    this.$el.html('');

    _.each(this.nearby_routes(), function(route_config){
      this.render_route(route_config);
    }, this);

    this.fetch_predictions();
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