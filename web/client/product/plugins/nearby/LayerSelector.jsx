/*
 * Copyright 2020, GeoSolutions Sas.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React, {useState, useEffect} from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import {isEmpty} from 'lodash';
import localizedProps from '../../../components/misc/enhancers/localizedProps';
const SelectLocalized = localizedProps(['placeholder', 'clearValueText', 'noResultsText'])(Select);

const LayerSelector = ({ responses, index,setIndex}) => {

    const selectProps = {clearable: false, isSearchable: true};
    const [options, setOptions] = useState([]);
    const [title, setTitle] = useState("");

    useEffect(()=>{
        if (!isEmpty(responses)) {
            responses.reverse()
            setOptions(responses.map((opt, idx)=> {
                const value = opt?.title;
                // Display only valid responses in the drop down
                return {label: value, value, idx, style: {display: 'block'}};
            }));
        }
    }, [responses]);

    useEffect(()=>{
        setTitle(responses[index]?.title || "");
    }, [responses, index]);

    const onChange = (event) => {
        const idx = event?.idx || 0;
        setIndex(idx);
    };
    return (
        <div id="identify-layer-select" style={{flex: "1 1 0%"}}>
            <SelectLocalized
                {...selectProps}
                onChange={onChange}
                value={title || ""}
                options={options}
                noResultsText="identifyLayerSelectNoResult"
            />
        </div>
    );
};

LayerSelector.defaultProps = {
    responses: [],
    index: -1
};

LayerSelector.propTypes = {
    responses: PropTypes.array,
    setIndex: PropTypes.func,
    index: PropTypes.number,
};

export default LayerSelector;
