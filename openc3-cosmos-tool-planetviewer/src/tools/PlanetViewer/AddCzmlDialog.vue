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
    <v-navigation-drawer v-model="show" absolute temporary right width="600">
      <v-system-bar>
        <v-spacer />
        <span> Load Czml </span>
        <v-spacer />
      </v-system-bar>

      <v-card-text>
        <div class="pa-3">
          <v-row> Load a CZML file. </v-row>
          <v-row>
            <v-file-input v-model="file" accept=".czml" />
          </v-row>
          <v-row> 
            <v-expansion-panels v-model="panel" :disabled="disabled">
              <v-expansion-panel>
                <v-expansion-panel-header disable-icon-rotate>
                  Edit CZML definition
                  <template v-slot:actions>
                    <v-icon>{{ expansionIcon }}</v-icon>
                  </template>
                </v-expansion-panel-header>
                <v-expansion-panel-content>
                  <v-textarea
                    v-model="czml"
                    rows="12"
                    :rules="[rules.required]"
                    data-test="czml-text-input"
                  />
                </v-expansion-panel-content>
              </v-expansion-panel>
            </v-expansion-panels>
          </v-row>
          <v-row class="pa-2">
            <span class="red--text" v-show="error" v-text="error" />
          </v-row>
          <v-row>
            <v-btn
              color="primary"
              @click="load"
              :disabled="!file"
              :loading="loading"
              data-test="add-czml-load-btn"
            >
              Upload
              <template v-slot:loader>
                <span>Loading...</span>
              </template>
            </v-btn>
            <v-spacer />
            <v-btn
              @click="clear"
              outlined
              class="mx-2"
              data-test="create-czml-cancel-btn"
            >
              Cancel
            </v-btn>
            <v-btn
              @click="submit"
              class="mx-2"
              color="primary"
              data-test="create-czml-submit-btn"
              :disabled="!!error"
            >
              Ok
            </v-btn>
          </v-row>
        </div>
      </v-card-text>
    </v-navigation-drawer>
  </div>
</template>

<script>
export default {
  props: {
    value: Boolean, // value is the default prop when using v-model
  },
  data() {
    return {
      rules: {
        required: (value) => !!value || 'Required',
      },
      czml: '',
      disabled: true,
      panel: [],
      expansionIcon: '',
      readerError: '',
      file: null,
      readingFile: false,
    }
  },
  computed: {
    error: function () {
      if (this.show === false) {
        return null
      }
      if (this.czml === '') {
        return 'CZML input can not be blank.'
      }
      if (this.readerError !== '') {
        return this.readerError
      }
      return null
    },
    show: {
      get() {
        return this.value
      },
      set(value) {
        this.$emit('input', value) // input is the default event when using v-model
      },
    },
  },
  methods: {
    clear: function () {
      this.show = !this.show
      this.czml = ''
      this.disabled = true
      this.panel = []
      this.expansionIcon = ''
      this.readerError = ''
      this.file = null
    },
    submit: function () {
      this.$emit('load', JSON.parse(this.czml))
    },
    load: function () {
      const fileReader = new FileReader()
      fileReader.readAsText(this.file)
      this.readingFile = true
      const that = this
      fileReader.onerror = function () {
        that.readerError = ''
        that.readingFile = false
        that.file = null
        that.expansionIcon = 'mdi-alert-circle'
      }
      fileReader.onload = function () {
        that.readingFile = false
        that.czml = fileReader.result
        that.file = null
        that.disabled = false
        that.expansionIcon = 'mdi-check'
      }
    },
  },
}
</script>

<style scoped>
.theme--dark .v-card__title,
.theme--dark .v-card__subtitle {
  background-color: var(--v-secondary-darken3);
}
</style>
