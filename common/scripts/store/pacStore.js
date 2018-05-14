import { applyMiddleware,createStore } from 'redux'
import pacReducer from '../reducers/pacReducer/index.js'
import { save, load } from "redux-localstorage-simple"


const createStoreWithMiddleware
    = applyMiddleware(
        save({states: ["pacFile"],namespace: "wsextension"})
    )(createStore)


const pacStore = createStoreWithMiddleware(
    pacReducer,
    load({states: ["pacFile"],immutablejs : true,namespace: "wsextension"})
)



export default pacStore
