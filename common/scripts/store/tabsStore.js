import { applyMiddleware,createStore } from 'redux'
import tabsReducer from '../reducers/tabs/index.js'
import { save, load } from "redux-localstorage-simple"



const createStoreWithMiddleware
    = applyMiddleware(
    save({states: ["tabs"], namespace : "wsextension"})
)(createStore);


const tabsStore = createStoreWithMiddleware(
    tabsReducer,
    load({states: ["tabs"], immutablejs : true, namespace : "wsextension"})
);

export default tabsStore
