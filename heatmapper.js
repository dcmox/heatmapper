var getScreenSize = function (trueSize) {
    if (trueSize === void 0) { trueSize = true; }
    if (document.documentElement && trueSize) {
        return document.documentElement.clientWidth.toString() + "x" + document.documentElement.clientHeight.toString();
    }
    else {
        return window.innerWidth.toString() + "x" + window.innerHeight.toString();
    }
};
var getScreenSizes = function (mapId) {
    if (mapId === void 0) { mapId = '_coordMap_default'; }
    if (mapId && window["_coordMap_" + mapId]) {
        return Object.keys(window["_coordMap_" + mapId]);
    }
    return [getScreenSize(false)];
};
var coordMapToJson = function (mapId, prettify) {
    if (prettify === void 0) { prettify = false; }
    if (window["_coordMap_" + mapId]) {
        return prettify ? JSON.stringify(window["_coordMap_" + mapId], null, 2)
            : JSON.stringify(window["_coordMap_" + mapId]);
    }
    return '';
};
var loadCoordMaps = function (coordMaps, mapIds) {
    mapIds.forEach(function (mapId, i) {
        if (coordMaps[i]) {
            window["_coordMap_" + mapId] = coordMaps[i];
        }
    });
};
var loadCoordMap = function (coordMap, mapId) { return window["_coordMap_" + mapId] = coordMap; };
var getCoordMap = function (mapId) {
    if (mapId === void 0) { mapId = 'default'; }
    return window["_coordMap_" + mapId] || false;
};
var generateCoordMap = function (mapId) {
    if (mapId === void 0) { mapId = 'default'; }
    var screenSize = getScreenSize();
    var id = "_coordMap_" + mapId;
    if (id in window) {
        return false;
    }
    window[id] = {};
    var coordMap = window[id];
    window.addEventListener("resize", function () { return screenSize = getScreenSize(false); });
    var hoverTimer, hoverTime = 0;
    document.addEventListener("mousemove", function (event) {
        clearInterval(hoverTimer);
        if (!(screenSize in coordMap)) {
            coordMap[screenSize] = [];
        }
        var x = event.clientX + window.scrollX, y = event.clientY + window.scrollY;
        coordMap[screenSize].push([x, y]);
        hoverTimer = setInterval(function () {
            coordMap[screenSize].push([x, y]);
            hoverTime++;
            if (hoverTime > 5) {
                clearInterval(hoverTimer);
            }
        }, 1000);
    });
};
var generateHeatMap = function (dest, dimensions, mapIds, screenSize) {
    if (mapIds === void 0) { mapIds = ['default']; }
    var id = "_coordMap_" + mapIds[0];
    if (!(id in window)) {
        return false;
    }
    if (!screenSize) {
        screenSize = getScreenSize(false);
    }
    var coordMap = window[id];
    if (!coordMap[screenSize]) {
        return false;
    }
    var canvas = document.createElement('canvas');
    var _a = getScreenSize().split('x').map(function (sz) { return Number(sz); }), sw = _a[0], sh = _a[1];
    if (dimensions && (dimensions.maxWidth || dimensions.maxHeight)) {
        var sr = sw / sh;
        var srr = sh / sw;
        if (!dimensions.maxWidth) {
            dimensions.maxWidth = 0;
        }
        if (!dimensions.maxHeight) {
            dimensions.maxHeight = 0;
        }
        var smallestDimension = dimensions.maxWidth > dimensions.maxHeight
            ? dimensions.maxHeight : dimensions.maxWidth;
        if (sr === 1) {
            dimensions.width = smallestDimension;
            dimensions.height = smallestDimension;
        }
        else if (sr > 1 && dimensions.maxWidth) {
            dimensions.width = dimensions.maxWidth;
            dimensions.height = dimensions.maxWidth * srr;
        }
        else if (dimensions.maxHeight) {
            dimensions.height = dimensions.maxHeight;
            dimensions.width = dimensions.maxHeight * sr;
        }
        else {
            dimensions.width = dimensions.maxWidth;
            dimensions.height = dimensions.maxWidth * srr;
        }
    }
    canvas.width = dimensions ? dimensions.width : sw;
    canvas.height = dimensions ? dimensions.height : sh;
    var ctx = canvas.getContext('2d'), wr, hr;
    if (dimensions) {
        wr = dimensions.width / sw;
        hr = dimensions.height / sh;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var coordsTotal = coordMap[screenSize].length;
    ctx.filter = 'blur(5px)';
    var alpha = 0.1 / mapIds.length;
    mapIds.forEach(function (mapId) {
        id = "_coordMap_" + mapId;
        coordMap = window[id];
        for (var i = 0; i < coordsTotal; i++) {
            var _a = coordMap[screenSize][i], x = _a[0], y = _a[1];
            if (dimensions) {
                x = x * wr;
                y = y * hr;
            }
            ctx.fillStyle = "rgb(0, 0, 0, " + alpha + ")";
            ctx.beginPath();
            ctx.arc(x, y, 10, 0, 2 * Math.PI);
            ctx.fill();
        }
    });
    var levels = 256;
    var gradientCanvas = document.createElement('canvas');
    gradientCanvas.width = 1;
    gradientCanvas.height = levels;
    var gradientCtx = gradientCanvas.getContext('2d');
    var gradientColors = {
        0.4: 'blue',
        0.5: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    };
    var gradient = gradientCtx.createLinearGradient(0, 0, 0, levels);
    for (var pos in gradientColors) {
        gradient.addColorStop(Number(pos), gradientColors[pos]);
    }
    gradientCtx.fillStyle = gradient;
    gradientCtx.fillRect(0, 0, 1, levels);
    var gradientPixels = gradientCtx.getImageData(0, 0, 1, levels).data;
    var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    var pixels = imageData.data;
    var len = pixels.length / 4;
    while (len--) {
        var idx = len * 4 + 3;
        var alpha_1 = pixels[idx] / 256;
        var colorOffset = Math.floor(alpha_1 * 255);
        pixels[idx - 3] = gradientPixels[colorOffset * 4];
        pixels[idx - 2] = gradientPixels[colorOffset * 4 + 1];
        pixels[idx - 1] = gradientPixels[colorOffset * 4 + 2];
    }
    ctx.putImageData(imageData, 0, 0);
    var output = canvas.toDataURL('image/png');
    if (dest) {
        var destElement = void 0;
        if (typeof dest === 'string') {
            destElement = ~dest.indexOf('#') || ~dest.indexOf('.')
                ? document.querySelector(dest)
                : document.getElementById("" + dest);
        }
        else {
            destElement = dest;
        }
        if (destElement) {
            destElement.innerHTML = "<img src=\"" + output + "\" />";
        }
    }
    return output;
};
