from transit.models import NextbusBase

class RouteList(NextbusBase):
  @staticmethod
  def get(**options):
    route_list = RouteList(**options)
    route_list.fetch()
    return route_list

  def __init__(self, **options):
    super(RouteList, self).__init__(**options)
    self.routes = []

  def command(self):
    return 'routeList'
