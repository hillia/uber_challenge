Transit
==============

A webapp to display nearby bus stops and their departure times. 
  * Shows nearby bus routes based on user's browser geolocation.
  * Marks the nearest stop on the route regardless of direction. (TODO: Categorize routes/nearest stops by direction.)
  
API
--------------
Transit data is retrieved from NextBus API (http://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf). Each API command has a model that is created by extending the Nextbus.Base class. The commands currently supported are:

* RouteList (not used but present)
* RouteConfig
* Predictions

To populate the model, 1) instantiate it with a dict containing the necessary API parameters and 2) call fetch() to retrieve the data from the NextBus. For example:
  
```
  n_route = RouteConfig(agency='sf-muni', tag='J')
  n_route.fetch()
```
  
will give you a model repesenting the 'routeConfig' API command for the J route of the SF Muni.
  
You can then inspect the data using json():

```
  n_route.json['routes'][0]['title'] # 'J-Church'
```
    
In the dict of data, an XML node's children are placed under a key that is a pluralized form of the XML tag name. Example:
    
```
  # XML: <body> <routes tag="J" title="J-Church"> </body>
  n_route.json['routes'] # [{ tag: "J", title:"J-Church" }, ... ]
```
  
XML node attributes are represented as dict key-value pairs:

```
  # XML: <body> <routes tag="J" title="J-Church"> </body>
  n_route.json['routes'][0]['title'] # 'J-Church'
```

    
Caching
--------------

NextBus API responses are cached to reduce wait times. Uses Django's built in filesystem cache.
  
  
Backbone
--------------
Standard Backbone MVC is used. Backbone templates are generated using django-jstemplate + Mustache, and can be found in `transit/static/templates`.

Backbone Models correspond to the back-end API models with the exception that each Backbone Model represents only one such object (a single route's config, a single stop's predictions, etc). API calls which return data for multiple objects are represented instead as Collection (e.g. RouteConfigList, PredictionsList).


HTML/CSS
--------------
Website has been tested with:

* Chrome 34
* Firefox 28 (OS X Firefox does not support <video> tag)
* Internet Explorer 11

Does not currently support mobile devices.
  
Website uses several HTML5 / CSS3 tags so backwards compatibility is minimal.
  
TODO:
  
* Add fallbacks for older browsers (e.g. <video> on intro page)
* Use Bootstrap to handle page resizing / mobile better


Static files
--------------
Static files are currently hosted individually from the app.

TODO: 

* Compile all JS, CSS into singular files. 
* Set up cached static files directory.


Tests
--------------
Only the NextBus API models are covered by tests. Django's unittest library is used.

TODO: Add a Javascript testing framework so that we can test the Backbone models.
  
About
--------------
Written by Ian Hill
 
LinkedIn: https://www.linkedin.com/pub/ian-hill/1b/341/681
  
Personal Notes
--------------
* My first time using Django (and a refresher for Python)
* First time setting up Backbone MVC from scratch (though I've worked with existing code a fair amount)
* App is hosted from a rented VM with maximum request #, so caching API calls and condensing them to a few large ones was essential.
* Video on front page was taken from CC-licensed stock footage (https://www.youtube.com/watch?v=FarSjtiP3Sc). I ripped/edited/compressed it myself. Probably unnecessary but I've seen a lot of sites start using splash-page videos and wanted to give it a try.
* A couple of CSS tricks are lifted from the Internet. Source is listed where applicable.
* There's a lot of default django boilerplate. You can see it all here: https://github.com/hillia/uber_challenge/commit/bf673386808294cfb071a948cdd5868e59dbb6b5.
* I've been working on this off-and-on for the past 3 weeks. Probably should have written it in Ruby and cut more corners, but it was a good learning experience. :)
