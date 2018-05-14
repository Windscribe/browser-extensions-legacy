import { applyMiddleware,createStore } from 'redux'
import userInfoReducer from '../reducers/userInfo/index.js'
import { save, load } from "redux-localstorage-simple"



const createStoreWithMiddleware
    = applyMiddleware(
        save({states: ["userInfo"], namespace : "wsextension"})
    )(createStore);


const userInfoStore = createStoreWithMiddleware(
    userInfoReducer,
    load({states: ["userInfo"], immutablejs : true, namespace : "wsextension"})
);


export default userInfoStore
