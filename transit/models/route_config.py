from transit.models import NextbusBase

class RouteConfig(NextbusBase):
  @staticmethod
  def get(**options):
    route_config = RouteConfig(**options)
    route_config.fetch()
    return route_config

  def __init__(self, **options):
    super(RouteConfig, self).__init__(**options)
    self.tag = options.get('tag', None)

  def command(self):
    return 'routeConfig'

  def api_params(self):
    if self.tag != None:
      return { 'r': self.tag }
    return {}
