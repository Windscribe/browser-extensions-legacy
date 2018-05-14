
import { applyMiddleware,createStore } from 'redux'
import listsReducer from '../reducers/listsReducer/index.js'
import { save, load } from "redux-localstorage-simple"



const createStoreWithMiddleware
    = applyMiddleware(
        save({states: ["listsInfo"], namespace : "wsextension"})
    )(createStore)



const listsStore = createStoreWithMiddleware(
    listsReducer,
    load({states: ["listsInfo"], immutablejs : true, namespace : "wsextension"})
)


export default listsStore
