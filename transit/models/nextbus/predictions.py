from transit.models.nextbus import NextbusBase

class Predictions(NextbusBase):
  @staticmethod
  def get(**options):
    route_config = Predictions(**options)
    route_config.fetch()
    return route_config

  def __init__(self, **options):
    super(Predictions, self).__init__(**options)
    self.stops = options.get('stops', None)

  def command(self):
    return 'predictionsForMultiStops'

  def api_params(self):
    return { 'stops': ["{route}|{tag}".format(route=stop['route'], tag=stop['tag']) for stop in self.stops] }

  def cache_key(self):
    return self.command() + ':' + self.agency + ':' + '_'.join(self.api_params()['stops'])

  def cache_expiration(self):
    return 55 # Update a bit faster than a minute so we don't skip over a minute.