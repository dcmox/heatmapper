interface ICoordMap { [key: string]: number[][] }
interface IDimensions { width?: number, height?: number, maxWidth?: number, maxHeight?: number }
interface IPoint { x: number, y: number }
const getScreenSize = (trueSize: boolean = true): string => {
    if (document.documentElement && trueSize) {
        return document.documentElement.clientWidth.toString() + "x" + document.documentElement.clientHeight.toString()
    } else {
        return window.innerWidth.toString() + "x" + window.innerHeight.toString()
    }
}
const getScreenSizes = (mapId: string = '_coordMap_default'): string[] => {
    if (mapId && window[`_coordMap_${mapId}`]) {
        return Object.keys(window[`_coordMap_${mapId}`])
    }
    return [ getScreenSize(false) ]
}
const coordMapToJson = (mapId: string, prettify: boolean = false): string => {
    if (window[`_coordMap_${mapId}`]) {
        return prettify ? JSON.stringify(window[`_coordMap_${mapId}`], null, 2)
            : JSON.stringify(window[`_coordMap_${mapId}`])
    }
    return ''
}

const loadCoordMaps = (coordMaps: ICoordMap[], mapIds: string[]) => {
    mapIds.forEach((mapId: string, i: number) => {
        if (coordMaps[i]) {
            window[`_coordMap_${mapId}`] = coordMaps[i]
        }
    })
}

const loadCoordMap = (coordMap: ICoordMap, mapId: string) => window[`_coordMap_${mapId}`] = coordMap
const getCoordMap = (mapId: string = 'default'): ICoordMap => window[`_coordMap_${mapId}`] || false
const generateCoordMap = (mapId: string = 'default') => {
    let screenSize: string = getScreenSize()
    const id: string = `_coordMap_${mapId}`
    if (id in window) { return false }
    window[id] = {}
    const coordMap = window[id]
    window.addEventListener("resize", () => screenSize = getScreenSize(false))
    let hoverTimer, hoverTime: number = 0
    document.addEventListener("mousemove", (event) => {
        clearInterval(hoverTimer)
        if (!(screenSize in coordMap)) { coordMap[screenSize] = [] }      
        let x: number = event.clientX + window.scrollX, y: number = event.clientY + window.scrollY
        coordMap[screenSize].push([x, y])
        hoverTimer = setInterval(() => {
            coordMap[screenSize].push([x, y])
            hoverTime++
            if (hoverTime > 5) { clearInterval(hoverTimer) }
        }, 1000)
    })
}

const generateHeatMap = (dest?: string | HTMLElement, dimensions?: IDimensions, mapIds: string[] = ['default'], screenSize?: string) => {
    let id: string = `_coordMap_${mapIds[0]}`
    if (!(id in window)) { return false }
    if (!screenSize) { screenSize = getScreenSize(false) }
    let coordMap: ICoordMap = window[id]
    if (!coordMap[screenSize]) { return false }

    let canvas: HTMLCanvasElement = document.createElement('canvas')
    let [sw, sh]: number[] = getScreenSize().split('x').map((sz: string) => Number(sz))

    if (dimensions && (dimensions.maxWidth || dimensions.maxHeight)) {
        let sr: number = sw / sh
        let srr: number = sh / sw
        if (!dimensions.maxWidth) {
            dimensions.maxWidth = 0
        }
        if (!dimensions.maxHeight) {
            dimensions.maxHeight = 0
        }
        let smallestDimension: number = dimensions.maxWidth > dimensions.maxHeight
            ? dimensions.maxHeight : dimensions.maxWidth 
        if (sr === 1) {
            dimensions.width = smallestDimension
            dimensions.height = smallestDimension
        } else if (sr > 1 && dimensions.maxWidth) {
            dimensions.width = dimensions.maxWidth
            dimensions.height = dimensions.maxWidth * srr
        } else if (dimensions.maxHeight){
            dimensions.height = dimensions.maxHeight
            dimensions.width = dimensions.maxHeight * sr
        } else {
            dimensions.width = dimensions.maxWidth
            dimensions.height = dimensions.maxWidth * srr
        }
    }
    canvas.width = dimensions ? dimensions.width : sw
    canvas.height = dimensions ? dimensions.height : sh

    let ctx: CanvasRenderingContext2D = canvas.getContext('2d'), wr: number, hr: number

    if (dimensions) {
        wr = dimensions.width / sw
        hr = dimensions.height / sh
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    let coordsTotal: number = coordMap[screenSize].length
    ctx.filter = 'blur(5px)'
    let alpha: number = 0.1 / mapIds.length
    mapIds.forEach((mapId: string) => {
        id = `_coordMap_${mapId}`
        coordMap = window[id]
        for (let i = 0; i < coordsTotal; i++) {
            let [x, y]: number[] = coordMap[screenSize][i]
            if (dimensions) {
                x = x * wr
                y = y * hr
            }
            ctx.fillStyle = `rgb(0, 0, 0, ${alpha})`
            ctx.beginPath()
            ctx.arc(x, y, 10, 0, 2 * Math.PI)
            ctx.fill()
        }    
    })

    let levels: number = 256
    let gradientCanvas: HTMLCanvasElement = document.createElement('canvas')
    gradientCanvas.width = 1
    gradientCanvas.height = levels
    let gradientCtx: CanvasRenderingContext2D = gradientCanvas.getContext('2d')

    let gradientColors = {
        0.4: 'blue',
        0.5: 'cyan',
        0.6: 'lime',
        0.8: 'yellow',
        1.0: 'red'
    }

    let gradient: CanvasGradient = gradientCtx.createLinearGradient(0, 0, 0, levels)
    for (let pos in gradientColors) { gradient.addColorStop(Number(pos), gradientColors[pos]) }

    gradientCtx.fillStyle = gradient
    gradientCtx.fillRect(0, 0, 1, levels)

    let gradientPixels = gradientCtx.getImageData(0, 0, 1, levels).data
    let imageData: any = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let pixels: any = imageData.data
    let len: number = pixels.length / 4

    while(len--) {
        let idx: number = len * 4 + 3
        let alpha: number = pixels[idx] / 256
    
        let colorOffset: number = Math.floor(alpha * 255)
        pixels[idx - 3] = gradientPixels[colorOffset * 4]
        pixels[idx - 2] = gradientPixels[colorOffset * 4 + 1]
        pixels[idx - 1] = gradientPixels[colorOffset * 4 + 2]
    }

    ctx.putImageData(imageData, 0, 0)
    const output: string = canvas.toDataURL('image/png')
    if (dest) {
        let destElement: HTMLElement
        if (typeof dest === 'string') {
            destElement = ~dest.indexOf('#') || ~dest.indexOf('.')
                ? document.querySelector(dest)
                : document.getElementById(`${dest}`)
        } else {
            destElement = dest
        }
        if (destElement) {
            destElement.innerHTML = `<img src="${output}" />`
        }
    }
    return output
}