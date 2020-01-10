# heatmapper-js
Heatmapper allows you to generate heatmaps based on mouse movements quickly using HTML canvas. The output can be saved as a PNG or stored for later use. This script is meant to run in the browser and has not been made to run server-side as of yet!

![heatmapper-js demo](https://i.imgur.com/jWtUC5r.jpg)

## Features
Some supported functions include:

* generateCoordMap - Generates data for your heatmap based on your mouse movements. This function is ran on this demo's page load.
* generateHeatMap - Generates a heatmap based on a coordinate map. This can accept multiple maps and will automatically handle them appropriately.
* getScreenSize - Gets the current viewport size within your browser.
* getScreenSizes - Gets all of the viewport sizes as you adjust the size of your browser window.
* coordMapToJson - Converts the stored coordinates to JSON based on a map ID.
* loadCoordMap/loadCoordMaps - Loads coordinates into the window context for generating a map.
* getCoordMap - Get a current instance of a coord map being stored or generated.

## Usage
You can start recording mouse movements using the following HTML:
```js
<script src="heatmapper.js" type="text/javascript"></script>
<script>generateCoordMap()</script>
```

To render the heatmap on-screen:

```html
<button id="displayHeatMap" onclick="generateHeatMap('result', {maxWidth: 1000, maxHeight: 600});">Display Heat Map</button>
```

or:

```html
<button id="displayHeatMap" onclick="generateHeatMap('#targetDiv', {maxWidth: 1000});">Display Heat Map</button>
```

To store the generated output without rendering it on-screen:

```js
<script>
    let output = generateHeatMap()
</script>
```

The parameters for generateHeatMap are defined in the [heatmapper.ts](heatmapper.ts) file:

```
dest?: string | HTMLElement - target element or query string to render the output to.
dimensions?: IDimensions - object containing width and height or maxWidth and maxHeight
mapIds: string[] = ['default'] - mapIds to render ('default' is the default when using generateCoordMap)
screenSize?: string - the screenSize to use for coordinates, by default it is the browsers current viewport size
```

## Demo
See the [tests/tests.html](tests/test.html) page for a visual demonstration.