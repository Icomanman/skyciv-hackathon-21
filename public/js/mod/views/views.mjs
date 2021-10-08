
const extractionModal = (callback) => {
    const page = jQuery('#app').append(`
    <div class="ui tiny modal">
        <div class="header">Select model and joint</div>
        <div class="content centered">
            <div class="ui form">
                <div class="two fields">
                    <div class="field">
                        <div class="ui labeled input">
                            <div class="ui label">Model Name</div>
                            <input type="text" name="model-name" />
                        </div>
                    </div>
                    <div class="field">
                        <div class="ui labeled input">
                            <div class="ui label">Joint No.</div>
                            <input type="text" name="joint-no" />
                        </div>
                    </div>
                </div> 
                <div class="ui centered grid">
                    <div class="row">
                        <button id="ok-btn" class="ui button">Ok</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    `);
    setTimeout(() => {
        jQuery('.tiny.modal').modal('show');
    }, 50);

    let model_name = jQuery('[name=model-name]').val();
    let joint_no = jQuery('[name=joint-no]').val();

    jQuery('#ok-btn').bind('click', () => {
        model_name = jQuery('[name=model-name]').val();
        joint_no = jQuery('[name=joint-no]').val();
        if (model_name === '' || joint_no === '') SKYCIV_UTILS.alert('Fields cannot be empty.');
        else {
            ACI.model_name = model_name;
            ACI.joint_no = joint_no;
            jQuery('.tiny.modal').modal('hide');
            callback(model_name, joint_no);
        };
    })

};

export function detailsMenu() {
    const dat = ACI.UI.data.details;
    // init
    dat.joint_type = 1;
    dat.column_type = 'ext';

    const component_options = {
        data: function () {
            return {
                joint_type: dat.joint_type,
                column_type: dat.column_type,
                fc: dat.fc,
                fy: dat.fy,
                beams: dat.beams,
                button_loading: false
            }
        },
        methods: {
            updateValue: function (evt, key) {
                const val = evt.target.value;
                dat[key] = isNaN(Number(val)) ? val : parseFloat(val);
                if (key === 'column_type') {
                    this.beams = val === 'ext' ? [1, 2, 3] : [1, 2, 3, 4];
                    dat.beams = this.beams;
                }
            },
            getModel: async function () {
                extractionModal(async (model_name, joint_no) => {
                    this.button_loading = true;
                    const api_results = await ACI.callAPI(model_name);
                    const err = ACI.chkAPIResults(api_results)
                    if (err) {
                        SKYCIV_UTILS.alert(err);
                    } else {
                        ACI.v_EVENT.$emit('api-success', { func: api_results.functions, joint_no });
                    }
                    this.button_loading = false;
                });
            }
        },
        mounted: function () {
            ACI.v_EVENT.$on('api-success', response => {
                console.log('> API call sucessful.');
                console.log(response);
            });
        },
        template: `
        <div>
            <div class="field">
                <div class="ui labeled input">
                    <div class="ui label">Joint Type</div>
                    <select
                        disabled
                        name="joint-type"
                        id="joint-type"
                        class="ui dropdown"
                        v-model="joint_type"
                        @change="updateValue">
                        <option selected value="1">Type 1</option>
                        <option value="2">Type 2</option>
                    </select>
                </div>
            </div>
            <div class="field">
                <div class="ui labeled input">
                    <div class="ui label">Column Type</div>
                    <select
                        disabled
                        name="column-type"
                        id="column-type"
                        class="ui dropdown"
                        v-model="column_type"
                        @change="updateValue($event, 'column_type')">
                        <option selected value="int">Interior</option>
                        <option value="ext">Exterior</option>
                    </select>
                </div>
            </div>
            <div class="two fields">
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">f'c, ksi</div>
                        <input type="text" v-model.lazy="fc" @change="updateValue($event, 'fc')" />
                    </div>
                </div>
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">fy, ksi</div>
                        <input type="text" v-model.lazy="fy" @change="updateValue($event, 'fy')" />
                    </div>
                </div>
            </div>

            <h4 class="ui dividing header">Beam Reinforcements</h4>
            <div class="ui centered grid">
                <div class="two column row">
                    <div class="column">
                        <div v-for="beam in beams" :key="'As-' + beam">
                            <div class="fields">
                                <div class="ui labeled input">
                                    <div class="ui label">A<sub>s{{beam}}</sub>, in<sup>2</sup></div>
                                    <input :name="'As' + beam" type="text" @change="updateValue($event, 'As' + beam)" />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="column" style="padding-left: 23%">
                        <img class="ui tiny image" src="/img/beam-sec.jpg" />
                    </div>
                </div>
                <div class="row">
                    <button class="ui black button" :class="{ loading : button_loading }" @click="getModel">Extract Geometry from S3D</button>
                </div>
            </div>

            <div class="ui horizontal divider">Or</div>

            <h4 class="ui dividing header">Beam Dimensions</h4>
            <div class="two fields" v-for="beam in beams" :key="beam">
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">b<sub>{{beam}}</sub>, in</div>
                        <input :name="'b' + beam" type="text" @change="updateValue($event, 'b' + beam)" />
                    </div>
                </div>
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">h<sub>{{beam}}</sub>, in</div>
                        <input :name="'h' + beam" type="text" @change="updateValue($event, 'h' + beam)" />
                    </div>
                </div>
            </div>
            <h4 class="ui dividing header">Column Dimensions</h4>
            <div class="two fields">
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">b<sub>c</sub>, in</div>
                        <input name="bc" type="text" @change="updateValue($event, 'bc')" />
                    </div>
                </div>
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">h<sub>c</sub>, in</div>
                        <input name="hc" type="text" @change="updateValue($event, 'hc')" />
                    </div>
                </div>
            </div>
        </div>
        `
    };

    return component_options;
}

export function loadsMenu() {
    const dat = ACI.UI.data.loads;
    const component_options = {
        computed: {
            beams: function () {
                const beams_arr = (this.shared.details.beams).length == 4 ? [1, 2, 3, 4] : [1, 2];
                return beams_arr;
            }
        },
        data: function () {
            return {
                columns: [3, 4], // default, top and bottom
                button_loading: false
            }
        },
        methods: {
            updateValue: function (evt, key) {
                const val = evt.target.value;
                dat[key] = isNaN(Number(val)) ? val : parseFloat(val);
            },
            solveModel: async function () {
                extractionModal(async (model_name, joint_no) => {
                    this.button_loading = true;
                    const api_results = await ACI.callAPI(model_name, true);
                    const err = ACI.chkAPIResults(api_results)
                    if (err) {
                        SKYCIV_UTILS.alert(err);
                    } else {
                        ACI.v_EVENT.$emit('api-success', { func: api_results.functions, joint_no });
                    }
                    this.button_loading = false;
                });
            }
        },
        props: { shared: Object },
        template: `
        <div> 
            <div class="ui centered grid">
                <div class="row">
                    <button class="ui black button" :class="{ loading : button_loading }" @click="solveModel">Extract Loads from S3D</button>
                </div>
            </div>
            <div class="ui horizontal divider">Or</div>
            <h4 class="ui dividing header">Beam Loads</h4>
            <div class="two fields" v-for="beam in beams" :key="beam">
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">V<sub>{{beam}}</sub>, kips</div>
                        <input :name="'V' + beam" type="text" @change="updateValue($event, 'V' + beam)" />
                    </div>
                </div>
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">M<sub>{{beam}}</sub>, kips-in</div>
                        <input :name="'M' + beam" type="text" @change="updateValue($event, 'M' + beam)"/>
                    </div>
                </div>
            </div>
            <h4 class="ui dividing header">Column Loads</h4>
            <div class="two fields" v-for="column in columns" :key="column">
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">V<sub>{{column}}</sub>, kips</div>
                        <input :name="'V' + column" type="text" @change="updateValue($event, 'V' + column)" />
                    </div>
                </div>
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">M<sub>{{column}}</sub>, kips-in</div>
                        <input :name="'M' + column" type="text" @change="updateValue($event, 'M' + column)"/>
                    </div>
                </div>
            </div>
            <div class="two fields" v-for="column in columns" :key="column + 2">
                <div class="field">
                    <div class="ui labeled input">
                        <div class="ui label">N<sub>{{column}}</sub>, kips</div>
                        <input :name="'N' + column" type="text" @change="updateValue($event, 'N' + column)" />
                    </div>
                </div>
            </div>
        </div>
        `
    }
    return component_options;
}

export function resultsMenu() {
    const component_options = {
        data: function () {
            return {
                results: []
            }
        },
        methods: {
            runCalcs: function () {
                const results = ACI.calcs(ACI.UI.data);
                if (results) {
                    Object.assign(ACI.results, { ...results });
                    this.results.push(results);
                }
            }
        },
        template: `
        <div>
            <div v-if="results.length > 0" class="ui relaxed divided list">
                <slot></slot>
                <result_comp :results="results" :key="index"/>
            </div>
            <div v-else class="ui centered grid" style="min-height: 80px; padding-top: px">
                <div class="row">
                    <button class="ui black button" @click="runCalcs">Run Analysis Check</button>
                </div>
            </div> 
        </div>
        `
    }
    return component_options;
}