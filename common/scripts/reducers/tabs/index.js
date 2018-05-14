import { combineReducers } from 'redux'
import firstReducer from './manage.js'

const tabs = combineReducers({tabs : firstReducer});

export default tabs