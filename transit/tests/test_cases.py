from django.test import TestCase
from transit.models.nextbus import RouteList
from transit.models.nextbus import RouteConfig
from transit.models.nextbus import Predictions

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

class PredictionsMockTestCase(TestCase):
  def mockPredictionsXml(self):
    return """
      <body copyright="All data copyright San Francisco Muni 2014.">
        <predictions agencyTitle="San Francisco Muni" routeTitle="N-Judah" routeTag="N" stopTitle="King St &amp; 4th St" stopTag="5240">
          <direction title="Outbound to Ocean Beach via Downtown">
            <prediction epochTime="1397787120000" seconds="117" minutes="1" isDeparture="true" affectedByLayover="true" dirTag="N__OB1" vehicle="1492" vehiclesInConsist="2" block="9702" tripTag="6041082"/>
            <prediction epochTime="1397787720000" seconds="717" minutes="11" isDeparture="true" affectedByLayover="true" dirTag="N__OB1" vehicle="1470" vehiclesInConsist="2" block="9725" tripTag="6041083"/>
            <prediction epochTime="1397788320000" seconds="1317" minutes="21" isDeparture="true" affectedByLayover="true" dirTag="N__OB1" vehicle="1543" vehiclesInConsist="2" block="9703" tripTag="6041084"/>
            <prediction epochTime="1397788920000" seconds="1917" minutes="31" isDeparture="true" affectedByLayover="true" dirTag="N__OB1" vehicle="1425" vehiclesInConsist="2" block="9716" tripTag="6041085"/>
            <prediction epochTime="1397789580000" seconds="2577" minutes="42" isDeparture="true" affectedByLayover="true" dirTag="N__OB1" vehicle="1424" vehiclesInConsist="2" block="9705" tripTag="6041086"/>
          </direction>
          <message text="Sign-up for Route/Line specific Email/Text Alerts @ sfmta.com" priority="Normal"/>
          <message text="For real time srv alerts follow us on Twitter: sfmta_muni" priority="Normal"/>
        </predictions>
        <predictions agencyTitle="San Francisco Muni" routeTitle="J-Church" routeTag="J" stopTitle="Embarcadero Station Outbound" stopTag="7217">
          <direction title="Outbound to Balboa Park Station">
            <prediction epochTime="1397787086517" seconds="83" minutes="1" isDeparture="false" dirTag="J__OB1" vehicle="1474" block="9310" tripTag="6041190"/>
            <prediction epochTime="1397787512063" seconds="509" minutes="8" isDeparture="false" dirTag="J__OB1" vehicle="1465" block="9307" tripTag="6041191"/>
            <prediction epochTime="1397788851364" seconds="1848" minutes="30" isDeparture="false" dirTag="J__OB1" vehicle="1481" block="9304" tripTag="6041192"/>
            <prediction epochTime="1397789224434" seconds="2221" minutes="37" isDeparture="false" affectedByLayover="true" dirTag="J__OB1" vehicle="1488" block="9305" tripTag="6041193"/>
            <prediction epochTime="1397790244434" seconds="3241" minutes="54" isDeparture="false" affectedByLayover="true" dirTag="J__OB1" vehicle="1482" block="9301" tripTag="6041194"/>
          </direction>
          <message text="Sign-up for Route/Line specific Email/Text Alerts @ sfmta.com" priority="Normal"/>
          <message text="For real time srv alerts follow us on Twitter: sfmta_muni" priority="Normal"/>
        </predictions>
      </body>
    """

  def setUp(self):
    self.predictions = Predictions.get(agency='sf-muni', stops=[{'route': 'N', 'tag': 5240}, {'route': 'K', 'tag': 7217}])
    self.predictions._fetch_raw_xml = self.mockPredictionsXml
    self.predictions.fetch()

  def testXmlParsing(self):
    predictions = self.predictions.json['predictionss']

    self.assertEqual(len(predictions), 2)
    self.assertEqual(len(predictions[0]['directions'][0]['predictions']), 5)
    for prediction in predictions[0]['directions'][0]['predictions']:
      for attr in ['minutes', 'vehicle']:
        self.assertIn(attr, prediction.keys())