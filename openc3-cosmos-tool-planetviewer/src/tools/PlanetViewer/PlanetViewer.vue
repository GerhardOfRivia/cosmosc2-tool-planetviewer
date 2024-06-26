<!--
# Copyright 2021 Ball Aerospace & Technologies Corp.
# All Rights Reserved.
#
# This program is free software; you can modify and/or redistribute it
# under the terms of the GNU Affero General Public License
# as published by the Free Software Foundation; version 3 with
# attribution addendums as found in the LICENSE.txt
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU Affero General Public License for more details.
#
# This program may also be used under the terms of a commercial or
# enterprise edition license of COSMOS if purchased from the
# copyright holder
-->

<template>
  <div>
    <v-snackbar
      v-model="showAlert"
      :top="true"
      :type="alertType"
      :timeout="5000"
    >
      <v-icon> mdi-{{ alertType }} </v-icon>
      {{ alert }}
      <template v-slot:action="{ attrs }">
        <v-btn text v-bind="attrs" @click="showAlert = false"> Close </v-btn>
      </template>
    </v-snackbar>
    <v-overlay :value="loadingOverlay">
      <v-progress-circular indeterminate size="64" />
    </v-overlay>
    <top-bar :menus="menus" :title="title" />
    <div style="max-height: 100%">
      <div id="cesiumContainer"></div>
    </div>
    <imagery-provider-dialog
      v-model="imageryProviderDialog"
      :url="imageryProviderUrl"
      @alert="alertHandler"
      @url="urlHandler"
    />
    <rewatch-dialog
      v-model="rewatchDialog"
      @alert="alertHandler"
      @time="timeHandler"
    />
    <add-czml-dialog
      v-model="czmlDialog"
      @alert="alertHandler"
      @load="czmlHandler"
    />
    <add-static-dialog
      v-model="addStaticDialog"
      @alert="alertHandler"
      @create="createHandler"
      :mode="mode"
      :visuals="visuals"
    />
    <add-dynamic-dialog
      v-model="addDynamicDialog"
      @alert="alertHandler"
      @create="createHandler"
      :mode="mode"
      :visuals="visuals"
    />
    <visuals-dialog
      v-model="viewDialog"
      @alert="alertHandler"
      @update="updateHandler"
      :mode="mode"
      :visuals="visuals"
    />
    <open-config-dialog
      v-if="openConfig"
      v-model="openConfig"
      :tool="toolName"
      @success="openConfiguration($event)"
    />
    <save-config-dialog
      v-if="saveConfig"
      v-model="saveConfig"
      :tool="toolName"
      @success="saveConfiguration($event)"
    />
  </div>
</template>

<script>
import TopBar from '@openc3/tool-common/src/components/TopBar'
import OpenConfigDialog from '@openc3/tool-common/src/components/config/OpenConfigDialog'
import SaveConfigDialog from '@openc3/tool-common/src/components/config/SaveConfigDialog'
import Cable from '@openc3/tool-common/src/services/cable.js'
import { OpenC3Api } from '@openc3/tool-common/src/services/openc3-api'

import AddCzmlDialog from '@/tools/PlanetViewer/AddCzmlDialog'
import AddDynamicDialog from '@/tools/PlanetViewer/AddDynamicDialog'
import AddStaticDialog from '@/tools/PlanetViewer/AddStaticDialog'
import ImageryProviderDialog from '@/tools/PlanetViewer/ImageryProviderDialog'
import RewatchDialog from '@/tools/PlanetViewer/RewatchDialog'
import VisualsDialog from '@/tools/PlanetViewer/VisualsDialog'

import {
  Cartesian3,
  Clock,
  ClockRange,
  ClockStep,
  ClockViewModel,
  Color,
  ColorMaterialProperty,
  CustomDataSource,
  CzmlDataSource,
  ImageryLayer,
  JulianDate,
  PathGraphics,
  PointGraphics,
  SampledPositionProperty,
  TileMapServiceImageryProvider,
  Viewer,
  buildModuleUrl,
} from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'

export default {
  components: {
    AddCzmlDialog,
    AddDynamicDialog,
    AddStaticDialog,
    TopBar,
    ImageryProviderDialog,
    RewatchDialog,
    VisualsDialog,
    OpenConfigDialog,
    SaveConfigDialog,
  },
  data() {
    return {
      title: 'Planet Viewer',
      toolName: 'planet-viewer',
      openConfig: false,
      saveConfig: false,
      mode: 'cesium',
      menus: [
        {
          label: 'Cesium',
          items: [
            {
              label: 'Add Static Visual',
              icon: 'mdi-home-city',
              command: () => {
                this.addStaticDialog = true
              },
            },
            {
              label: 'Add Dynamic Visual',
              icon: 'mdi-motion',
              command: () => {
                this.addDynamicDialog = true
              },
            },
            {
              label: 'View Visuals',
              icon: 'mdi-eye',
              command: () => {
                this.viewDialog = true
              },
            },
            {
              divider: true,
            },
            {
              label: 'Reset Viewer',
              icon: 'mdi-restart',
              command: () => {
                this.resetViewer()
              },
            },
            {
              label: 'Imagery Url',
              icon: 'mdi-earth',
              command: () => {
                this.imageryProviderDialog = true
              },
            },
          ],
        },
        {
          label: 'Config',
          items: [
            {
              label: 'Current',
              icon: 'mdi-clock-outline',
              command: () => {
                this.updateMode('Current')
              },
            },
            {
              label: 'Rewatch',
              icon: 'mdi-timelapse',
              command: () => {
                this.rewatchDialog = true
              },
            },
            {
              divider: true,
            },
            {
              label: 'Load CZML',
              icon: 'mdi-file',
              command: () => {
                this.czmlDialog = true
              },
            },
            {
              divider: true,
            },
            {
              label: 'Open Configuration',
              icon: 'mdi-folder-open',
              command: () => {
                this.openConfig = true
              },
            },
            {
              label: 'Save Configuration',
              icon: 'mdi-content-save',
              command: () => {
                this.saveConfig = true
              },
            },
          ],
        },
      ],
      alert: '',
      alertType: 'success',
      showAlert: false,
      cable: new Cable(),
      loadingOverlay: false,
      imageryProviderDialog: false,
      imageryProviderUrl: 'Assets/Textures/NaturalEarthII',
      subscription: null,
      addStaticDialog: false,
      addDynamicDialog: false,
      czmlDialog: false,
      rewatchDialog: false,
      viewDialog: false,
      dynamicVisuals: [],
      staticVisuals: [],
      config: [],
      viewer: null,
      dataSource: null,
      startDateTime: null,
      stopDateTime: null,
    }
  },
  mounted: function () {
    this.updateMode('Current')
  },
  created: function () {
    this.cable
      .createSubscription('StreamingChannel', window.openc3scope, {
        received: (data) => this.received(data),
        disconnected: () => {
          this.alertHandler({
            text: 'OpenC3 backend connection disconnected.',
            type: 'error',
          })
        },
        rejected: () => {
          this.alertHandler({
            text: 'OpenC3 backend connection rejected.',
            type: 'error',
          })
        },
      })
      .then((subscription) => {
        this.subscription = subscription
      })
  },
  destroyed: function () {
    if (this.subscription) {
      this.subscription.unsubscribe()
    }
    this.cable.disconnect()
  },
  computed: {
    convertHandlerFuntions: function () {
      return {
        cartesian: this.createCartesianHandler,
        degrees: this.createCartesianFromDegreesHandler,
        radians: this.createCartesianFromRadiansHandler,
      }
    },
    eventHandlerFunctions: function () {
      return {
        create: {
          dynamic: this.createDynamicHandler,
          static: this.createStaticHandler,
        },
        delete: {
          dynamic: this.deleteDynamicVisual,
          static: this.deleteStaticVisual,
        },
      }
    },
    typeHandlerArray: function () {
      return {
        dynamic: this.dynamicVisuals,
        static: this.staticVisuals,
      }
    },
    rewatchEnabled: function () {
      return this.mode === 'Rewatch'
    },
    visuals: function () {
      return this.dynamicVisuals.concat(this.staticVisuals)
    },
  },
  watch: {
    loadingOverlay(val) {
      val &&
        setTimeout(() => {
          this.loadingOverlay = false
        }, 2000)
    },
  },
  methods: {
    alertHandler: function (event) {
      this.alert = event.text
      this.alertType = event.type
      this.showAlert = true
    },
    timeHandler: function (event) {
      // console.log(event)
      this.startDateTime = event.start
      this.stopDateTime = event.stop
      this.mode = ''
      this.updateMode('Rewatch')
      this.rewatchDialog = false
    },
    urlHandler: function (event) {
      // console.log(event)
      this.imageryProviderUrl = event
    },
    createCartesianHandler: (x, y, z) => new Cartesian3(x, y, z),
    createCartesianFromDegreesHandler: (longitude, latitude, height) =>
      Cartesian3.fromDegrees(longitude, latitude, height),
    createCartesianFromRadiansHandler: (longitude, latitude, height) =>
      Cartesian3.fromRadians(longitude, latitude, height),
    createHandler: (event) => this.eventHandlerFunctions.create[event.type](event),
    czmlHandler: function (event) {
      // console.log(event)
      try {
        const doc = event.filter((item) => item.id === 'document')
        if (doc.length === 1 && doc[0].clock && doc[0].clock.interval) {
          const timeArray = doc[0].clock.interval.split('/')
          this.startDateTime = new Date(timeArray[0]).getTime()
          this.stopDateTime = new Date(timeArray[1]).getTime()
          this.mode = ''
          this.updateMode('Rewatch')
        }
        this.viewer.dataSources.add(CzmlDataSource.load(event))
        this.czmlDialog = false
      } catch {
        this.alertHandler({
          text: `Failed to load CZML. ${error}`,
          type: 'error',
        })
      }
    },
    resetViewer: function () {
      this.$dialog
        .confirm('Are you sure you want to reset the viewer', {
          okText: 'Reset',
          cancelText: 'Cancel',
        })
        .then((dialog) => {
          this.clearVisuals()
          this.mode = ''
          this.updateMode('Current')
        })
        .catch((error) => {
          if (error) {
            this.alertHandler({
              text: `Failed to reset viewer. ${error}`,
              type: 'error',
            })
          }
        })
    },
    updateMode: function (mode) {
      if (this.mode === mode) {
        return
      }
      this.mode = mode
      if (!this.rewatchEnabled) {
        this.startDateTime = null
        this.stopDateTime = null
      }
      if (this.viewer) {
        this.clearVisuals()
        this.viewer.destroy()
      }

      const clock = new Clock({
        startTime: this.rewatchEnabled ? JulianDate.fromDate(new Date(this.startDateTime)) : undefined,
        stopTime: this.rewatchEnabled ? JulianDate.fromDate(new Date(this.stopDateTime)) : undefined,
        currentTime: this.rewatchEnabled
          ? JulianDate.fromDate(new Date(this.startDateTime))
          : JulianDate.fromDate(new Date()),
        clockStep: ClockStep.SYSTEM_CLOCK_MULTIPLIER,
        clockRange: this.rewatchEnabled ? ClockRange.LOOP_STOP : undefined,
        multiplier: 1, // how much time to advance each tick
        shouldAnimate: true, // Animation on by default
      })

      this.viewer = new Viewer('cesiumContainer', {
        clockViewModel: new ClockViewModel(clock),
        baseLayer: ImageryLayer.fromProviderAsync(
          TileMapServiceImageryProvider.fromUrl(buildModuleUrl(this.imageryProviderUrl)),
        ),
        baseLayerPicker: false,
        geocoder: false,
        timeline: this.rewatchEnabled,
        animation: this.rewatchEnabled,
        fullscreenButton: false,
        navigationHelpButton: false,
      })

      this.viewer.scene.globe.enableLighting = true
      this.dataSource = new CustomDataSource('OpenC3')
      this.viewer.dataSources.add(this.dataSource)
    },
    createDynamicHandler: function (event) {
      /*
        {
          type: this.type,
          name: this.visualName,
          resolution: this.resolution,
          targetName: this.selectedTargetName,
          packetName: this.selectedPacketName,
          itemX: this.selectedItemX,
          itemY: this.selectedItemY,
          itemZ: this.selectedItemZ,
          cartesianOrRadiansOrDegrees: 'degrees',
          pathResolution: this.pathResolution,
          leadTime: this.leadTime,
          trailTime: this.trailTime,
        }
      */
      try {
        this.createDynamicVisual(event)
        this.config.push(event)
      } catch (e) {
        this.alertHandler({
          text: `Failed to load dynamic visual: ${event.name}.\nError: ${e}`,
          type: 'error',
        })
      }
    },
    createDynamicVisual: function (event) {
      const eventColor = Color.fromCssColorString(event.color)
      this.dataSource.entities.add({
        id: event.name,
        position: new SampledPositionProperty(),
        point: new PointGraphics({
          color: eventColor,
          pixelSize: 7,
        }),
        path: new PathGraphics({
          resolution: event.pathResolution,
          material: new ColorMaterialProperty(eventColor),
          width: 2,
          leadTime: event.leadTime,
          trailTime: event.trailTime,
        }),
        name: event.name,
        description: JSON.stringify(event, null, 4),
      })
      const visual = {
        ...event,
        items: [
          `DECOM__TLM__${event.targetName}__${event.packetName}__${event.itemX.name}__CONVERTED`,
          `DECOM__TLM__${event.targetName}__${event.packetName}__${event.itemY.name}__CONVERTED`,
          `DECOM__TLM__${event.targetName}__${event.packetName}__${event.itemZ.name}__CONVERTED`,
        ],
      }
      OpenC3Auth.updateToken(OpenC3Auth.defaultMinValidity).then(() => {
        visual.subscription = this.subscription.perform('add', {
          scope: window.openc3Scope,
          token: localStorage.openc3Token,
          mode: 'DECOM',
          items: visual.items,
          start_time: this.rewatchEnabled ? this.startDateTime * 1_000_000 : null,
          end_time: this.rewatchEnabled ? this.stopDateTime * 1_000_000 : null,
        })
      })
      this.dynamicVisuals.push(visual)
      this.addDynamicDialog = false
      this.loadingOverlay = true
      // console.log(visual)
    },
    createStaticHandler: function (event) {
      /*
        {
          type: this.type,
          name: this.visualName,
          description: this.visualDescription,
          cartesianOrRadiansOrDegrees: 'degrees',
          longitude: this.longitude,
          latitude: this.latitude,
          height: this.height,
        }
      */
      try {
        this.createStaticVisual(event)
        this.config.push(event)
      } catch (e) {
        this.alertHandler({
          text: `Failed to load visual: ${event.name}.\n${e}`,
          type: 'error',
        })
      }
    },
    createStaticVisual: function (event) {
      const position = this.convertHandlerFuntions[event.cartesianOrRadiansOrDegrees](
        event.longitude,
        event.latitude,
        event.altitude,
      )
      this.dataSource.entities.add({
        id: event.name,
        position: position,
        point: new PointGraphics({
          color: Color.fromCssColorString(event.color),
          pixelSize: 7,
        }),
        name: event.name,
        description: event.description,
      })
      this.staticVisuals.push(event)
      this.addStaticDialog = false
    },
    received: function (data) {
      this.cable.recordPing()
      for (const event of data) {
        this.updateVisuals(event)
      }
    },
    updateHandler: function (event) {
      const visual = this.typeHandlerArray[event.visualType].find((visual) => event.visualName === visual.name)
      this.eventHandlerFunctions.delete[event.visualType](visual)
    },
    deleteVisual: function (visual) {
      this.eventHandlerFunctions.delete[visual.type](visual)
    },
    deleteDynamicVisual: function (visual) {
      let index = this.config.indexOf(visual.name)
      this.config.splice(index, 1)
      index = this.dynamicVisuals.indexOf(visual)
      this.dynamicVisuals.splice(index, 1)
      this.dataSource.entities.remove(this.dataSource.entities.getById(visual.name))
      OpenC3Auth.updateToken(OpenC3Auth.defaultMinValidity).then(() => {
        this.subscription.perform('remove', {
          scope: window.openc3Scope,
          token: localStorage.openc3Token,
          items: visual.items,
        })
      })
    },
    deleteStaticVisual: function (visual) {
      let index = this.config.indexOf(visual.name)
      this.config.splice(index, 1)
      index = this.staticVisuals.indexOf(visual)
      this.staticVisuals.splice(index, 1)
      this.dataSource.entities.remove(this.dataSource.entities.getById(visual.name))
    },
    updateVisuals: function (event) {
      // console.log(event)
      const properties = Object.keys(event)
      this.dynamicVisuals.map((visual) => {
        if (visual.items.every((item) => properties.includes(item))) {
          this.dataSource.entities
            .getById(visual.name)
            .position.addSample(
              new JulianDate.fromDate(new Date(event.__time / 1_000_000)),
              this.convertHandlerFuntions[visual.cartesianOrRadiansOrDegrees](
                event[visual.items[0]],
                event[visual.items[1]],
                event[visual.items[2]],
              ),
            )
        }
      })
    },
    clearVisuals: function () {
      for (const visual of this.dynamicVisuals) {
        this.deleteVisual(visual)
      }
      for (const visual of this.staticVisuals) {
        this.deleteVisual(visual)
      }
      this.dynamicVisuals = []
      this.staticVisuals = []
    },
    openConfiguration: function (name) {
      localStorage.lastconfig__planet_viewer = name
      new OpenC3Api()
        .load_config(this.toolName, name)
        .then((response) => {
          this.clearVisuals()
          const config = JSON.parse(response)
          this.imageryProviderUrl = config.imageryProviderUrl
          this.startDateTime = config.start
          this.stopDateTime = config.stop
          this.mode = ''
          this.updateMode(config.mode)
          for (const event of config.config) {
            this.createHandler(event)
          }
          this.alertHandler({
            text: `Loading configuartion: ${name}`,
            type: 'success',
          })
        })
        .catch((error) => {
          if (error) {
            this.alertHandler({
              text: `Failed to load configuration: ${name}. ${error}`,
              type: 'error',
            })
          }
        })
    },
    saveConfiguration: function (name) {
      localStorage.lastconfig__planet_viewer = name
      const config = {
        mode: this.mode,
        imageryProviderUrl: this.imageryProviderUrl,
        start: this.startDateTime,
        stop: this.stopDateTime,
        config: this.config,
      }
      // console.log(config)
      new OpenC3Api()
        .save_config(this.toolName, name, JSON.stringify(config))
        .then((response) => {
          // console.log(response)
          this.alertHandler({
            text: `Saved configuration: ${name}`,
            type: 'success',
          })
        })
        .catch((error) => {
          if (error) {
            this.alertHandler({
              text: `Failed to save configuration: ${name}.\nError: ${error}`,
              type: 'error',
            })
          }
        })
    },
  },
}
</script>

<style scoped>
.footer {
  bottom: 0;
  position: sticky;
  height: auto;
}
</style>
