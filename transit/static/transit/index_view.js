$(function () {

  var Route = Backbone.Model.extend({
    url: function() {
      return 'route_config/' + this.get('tag');
    }
  });

  var RouteList = Backbone.Model.extend({
    url: function() {
      return 'route_list/';
    }
  });

  var RouteListView = Backbone.View.extend({
    events: {
      'click .route': 'openRoute'
    },

    initialize: function() {
      this.listenTo(this.model, "change", this.render);
      this.routes = {};
    },

    openRoute: function(evt) {
      var $route = $(evt.target);
      var route = new Route({ tag: $route.data('tag') });
      route.fetch();
      console.log("OPENING ROUTE:", route);
    },

    render: function() {
      var routes_html = _.reduce(this.model.get('routes'), function(memo, route) {
        return memo + '<li class="route" data-tag="' + route['tag'] + '">' + route['tag'] + '</li>';
      }, "");
      this.$el.html(routes_html);
    }
  });

  var IndexView = Backbone.View.extend({
    initialize: function(){
      this.render();
      this.get_coordinates();
      this.get_routes();
    },

    get_coordinates: function() {
      var self = this;
      navigator.geolocation.getCurrentPosition(function(coordinates) {
        self.coordinates = coordinates;
        $('#coordinates').html(self.coordinates.toString());
      });
    },

    get_routes: function() {
      this.route_list = new RouteList();
      this.route_list_view = new RouteListView({
        el: '#route-list',
        model: this.route_list
      });
      this.route_list.fetch();
    },

    render: function(){
      this.$el.html('<ul id="route-list"></ul> <div id="coordinates"></div>');
    }
  });

  indexView = new IndexView({ el: '#index-view' });
});