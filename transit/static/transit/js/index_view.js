var Transit = Transit || {};

Transit.IndexView = Backbone.View.extend({
  render: function() {
    this.$el.html(Mustache.TEMPLATES.intro_screen);
    this.$el.find('#find-muni-button').click(function() {
      Transit.app.navigate('routes/nearby/' + $('#find-range-select option:selected').val(), {trigger: true});
    });
  }
});