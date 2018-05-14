import { combineReducers } from 'redux'
import firstReducer from './session.js'

const userInfo = combineReducers({userInfo : firstReducer});

export default userInfo
