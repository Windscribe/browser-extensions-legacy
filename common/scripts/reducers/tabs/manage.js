import Immutable from 'immutable';

const initialState = Immutable.fromJS({
    tabs: {},
    lastActiveTab: null,
    currentTabUrl: null,
    userAgent: window.navigator.userAgent,
});

export default (state = initialState, action) => {
    switch (action.type) {
        case 'INIT':
            return state;
        case 'SET_LAST_ACTIVE_TAB':
            return state.set('lastActiveTab', action.data);
        case 'SET_TABS':
            return state.set('tabs', action.data);
        case 'SET_CURRENT_TAB_URL':
            return state.set('currentTabUrl', action.data);
        case 'SET_USER_AGENT':
            return state.set('userAgent', action.data);
        case 'UPDATE_STATE':
            return Immutable.fromJS(action.data);
        default:
            return state;
    }
}