from django.test import TestCase
from transit.models import RouteList
from transit.models import RouteConfig

class RouteListMockTestCase(TestCase):
  def mockRouteXml(self):
    return """
    <body>
      <route tag="1" title="1 - California" shortTitle="1-Calif"/>
      <route tag="3" title="3 - Jackson" shortTitle="3-Jacksn"/>
      <route tag="4" title="4 - Sutter" shortTitle="4-Sutter"/>
      <route tag="5" title="5 - Fulton" shortTitle="5-Fulton"/>
      <route tag="6" title="6 - Parnassus" shortTitle="6-Parnas"/>
      <route tag="7" title="7 - Haight" shortTitle="7-Haight"/>
      <route tag="14" title="14 - Mission" shortTitle="14-Missn"/>
      <route tag="21" title="21 - Hayes" shortTitle="21-Hayes"/>
    </body>
    """

  def setUp(self):
    self.route_list = RouteList(agency='sf-muni')
    self.route_list._fetch_raw_xml = self.mockRouteXml
    self.route_list.fetch()

  def testXmlParsing(self):
    routes = self.route_list.json['routes']

    self.assertEqual(len(routes), 8)
    self.assertIn("21", [route['tag'] for route in routes])
    self.assertIn("21 - Hayes", [route['title'] for route in routes])


class RouteListLiveTestCase(TestCase):
  def setUp(self):
    self.route_list = RouteList.get(agency='sf-muni')

  def testXmlParsing(self):
    routes = self.route_list.json['routes']

    self.assertNotEqual(len(routes), 0)
    for route in routes:
      self.assertIn('tag', route.keys())
      self.assertIn('title', route.keys())


class RouteConfigLiveTestCase(TestCase):
  def setUp(self):
    self.route_config = RouteConfig.get(agency='sf-muni', tag='N')

  def testXmlParsing(self):
    routes = self.route_config.json['routes']

    self.assertEqual(len(routes), 1)
    for stop in routes[0]['stops']:
      for attr in ['tag', 'title', 'lat', 'lon', 'stopId']:
        self.assertIn(attr, stop.keys())
