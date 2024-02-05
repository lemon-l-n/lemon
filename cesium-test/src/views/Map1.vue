<template>
  <div class="layer-cesium">
    <div id="cesiumContainer"></div>
    <!-- <div class="input-panel">
      <label for="trajectory">输入飞行轨迹：</label>
      <input type="number" id="lonID" v-model.number="flyTarget.lonValue" placeholder="lon">
      <input type="number" id="latID" v-model.number="flyTarget.latValue" placeholder="lat">
      <input type="number" id="heightID" v-model.number="flyTarget.heightValue" placeholder="height">
      <button @click="startFly">开始飞行</button>
    </div> -->
  </div>
</template>

<script setup>
import { onMounted, reactive } from 'vue'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import * as Cesium from 'cesium'

console.log('Cesium', Cesium)

const flyTarget = reactive({
  lonValue: -74.01312421751199,
  latValue: 40.683945742423585,
  heightValue: 400.0
})

let mockData = [{ longitude: 116.405419, latitude: 39.918034, height: 0, time: 0 },
{ longitude: 120.2821, latitude: 33.918145, height: 0, time: 300 },
{ longitude: 115.497402, latitude: 39.344641, height: 70000, time: 600 },
{ longitude: 107.942392, latitude: 29.559967, height: 70000, time: 1100 },
{ longitude: 130.549265, latitude: 29.559967, height: 0, time: 1200 }]

let start = Cesium.JulianDate.fromDate(new Date());
// 结束时间
let stop = Cesium.JulianDate.addSeconds(start, 1200, new Cesium.JulianDate());
let viewer = reactive({})
let modelEntity = reactive({})
let positionProperty = reactive({})

onMounted(async() => {
  console.log('window.Cesium', window.Cesium)

  // 载入基础地图与terrain地形
	viewer = new Cesium.Viewer("cesiumContainer", {
   terrain: Cesium.Terrain.fromWorldTerrain({
     requestWaterMask: true,
     requestVertexNormals: true,
     shouldAnimate: true, // 必须为true开启动画 否则不会达到飞机模型飞行动画效果
     timeline: true,// 必须为true显示时间线组件
   })
 })

 viewer.scene.debugShowFramesPerSecond = false // 显示帧率
 viewer.scene.globe.enableLighting = true;

// 设置始时钟始时间
viewer.clock.startTime = start.clone();
// 设置时钟当前时间
viewer.clock.currentTime = start.clone();
// 设置始终停止时间
viewer.clock.stopTime = stop.clone();
// 时间速率，数字越大时间过的越快
viewer.clock.multiplier = 1;
// 时间轴
viewer.timeline.zoomTo(start, stop);
  viewer.scene.camera.setView({
    destination : new Cesium.Cartesian3(1332761, -4662399, 4137888),
    orientation : {
      heading: 0.6,
      pitch: -0.66,
      roll: 0
    },
    duration: 3
  })
   
  // 载入城市模型，纽约模型ID：75343
  const city = viewer.scene.primitives.add(
    await Cesium.Cesium3DTileset.fromIonAssetId(75343)
  )
  city.style = new Cesium.Cesium3DTileStyle({
    color:  "color('white', 0.85)", // 让建筑变透明
    show: true
  })


  // 载入飞机模型
  let property = createProperty(mockData)
  const modelPosition = Cesium.Cartesian3.fromDegrees(flyTarget.lonValue, flyTarget.latValue, flyTarget.heightValue)
  modelEntity = viewer.entities.add({
    id: 'move',
    name: 'Cesium_Air',
    position: property,// modelPosition,
    availability: new Cesium.TimeIntervalCollection([new Cesium.TimeInterval({
      start: start,
      stop: stop
    })]),
    orientation: new Cesium.VelocityOrientationProperty(property),
    model: {
      uri: 'http://127.0.0.1:5500/src/assets/SampleData/models/CesiumAir/Cesium_Air.glb', // 获取或设置字符串Property，该字符串指定glTF资产的URI。 
      minimumPixelSize: 100, // 获取或设置数字属性，指定近似最小值模型的像素大小，与缩放无关。这可以用来确保即使观看者缩小视图，模型仍然可见。当 0.0 时，没有强制执行最小大小。 
      maximumScale: 20000, // 获取或设置数字属性，该属性指定最大比例模型的大小
    },
    path: {
      resolution: 1,
      material: new Cesium.PolylineGlowMaterialProperty({
        glowPower: 0.1,
        color: Cesium.Color.YELLOW
      }),
      // leadTime、trailTime 不设置 path全显示
      // leadTime:0,// 设置为0时 模型通过后显示path
      trailTime: 0,// 设置为0时 模型通过后隐藏path
      width: 10
    }
  })

  viewer.clock.onTick.addEventListener((tick) => {

    let position = viewer.entities.getById('move').position.getValue(tick.currentTime)
    //世界坐标转换为经纬度
    let ellipsoid = viewer.scene.globe.ellipsoid
    let cartographic = ellipsoid.cartesianToCartographic(position);
    let lat = Cesium.Math.toDegrees(cartographic.latitude);
    let lng = Cesium.Math.toDegrees(cartographic.longitude);
    let alt = cartographic.height;
    viewer.scene.camera.setView({
      destination: Cesium.Cartesian3.fromDegrees(lng, lat, 100000),

    })
  })
  viewer.clock.onStop.addEventListener((tick) => {
    console.log(tick, 'stop')
    // 动画执行到结束时间时调用
    // 逻辑代码 removeEventListener => onTick
  })
})

function createProperty(source) {
  // 取样位置 相当于一个集合
  let property = new Cesium.SampledPositionProperty()
  for (let i = 0; i < source.length; i++) {
    let time = Cesium.JulianDate.addSeconds(start, source[i].time, new Cesium.JulianDate)
    let position = Cesium.Cartesian3.fromDegrees(source[i].longitude, source[i].latitude, source[i].height)
    // 添加位置，和时间对应
    property.addSample(time, position)
  }
  return property
}

function startFly() {
  const { lonValue, latValue, heightValue } = flyTarget
  if (positionProperty) {
    // 清除之前的飞行轨迹
    viewer.entities.remove(positionProperty)
  }
  // 位置
  const initialPosition = Cesium.Cartesian3.fromDegrees(
      lonValue,
      latValue,
      heightValue 
  )
  // 创建一个用于存储飞机轨迹的SampledPositionProperty
  positionProperty = new Cesium.SampledPositionProperty()
  positionProperty.addSample(Cesium.JulianDate.now(), initialPosition)
  // 添加飞行轨迹的样本点
  const steps = 2; // 轨迹的采样点数
  const secondsPerStep = 1; // 每个采样点之间的间隔时间（秒）

  for (let i = 1; i <= steps; i++) {
    const time = Cesium.JulianDate.addSeconds(Cesium.JulianDate.now(), i * secondsPerStep, new Cesium.JulianDate())
    const lon = lonValue + (i / steps) * (flyTarget.lonValue - lonValue)
    const lat = latValue + (i / steps) * (flyTarget.latValue - latValue)
    const height = heightValue + (i / steps) * (flyTarget.heightValue - heightValue)
    const position = Cesium.Cartesian3.fromDegrees(lon, lat, height)
    positionProperty.addSamples(time, position)
  }

  // 创建飞机模型的路径动画
  modelEntity.position = positionProperty._property
  console.log(2222221, modelEntity.position, positionProperty)
  // modelEntity.position.setInterpolationOptions({
  //   interpolationDegree: 5,
  //   interpolationAlgorithm: Cesium.HermitePolynomialApproximation
  // })

  viewer.clock.shouldAnimate = true
  }

</script>

<style lang="scss" scoped>
.layer-cesium {
  width: 100%;
  height: 100vh;
  #cesiumContainer {
    height: 100%;
  }
}
.input-panel {
  position: absolute;
  top: 20px;
  left: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 4px;
  padding: 10px;
  input[type="number"] {
    width: 50px;
    margin-right: 10px;
  }
}
.marker {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: green;
}
</style>