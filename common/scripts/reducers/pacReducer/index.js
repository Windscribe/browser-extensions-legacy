import { combineReducers } from 'redux'
import secondReducer from './pacFile.js'

const pacReducer = combineReducers({pacFile : secondReducer})

export default pacReducer
