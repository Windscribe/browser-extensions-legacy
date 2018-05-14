import _ from 'underscore';

export default {
    
    SET_POPUP_STATE: (response, self) => {
        !_.isEqual(_.pick(self.state, ['userInfo', 'lists', 'listsStates', 'recentLinks']), response.data) && self.setState(function (previousState, currentProps) {
            
            // animation workaround: it looks ok with this
            response.data.userInfo.current.appIsOn ? document.querySelector('html').style.backgroundColor = "#3064AF" :
                document.querySelector('html').style.backgroundColor = "#828282";
            return Object.assign({}, previousState, response.data)
        });
    },

    RM_SESSION: (response, self) => {
        // console.log('remove_session');
        self.context.router.push('/');
    },

    AUTH: (response, self) => {
        // console.log('auth');
        self.context.router.push('/');
    },

    RLINKS_DATA: (response, self) => {
        response.data && _.isArray(response.data) && self.state.recentLinks.length !== response.data.length &&
            self.setState(function (previousState, currentProps) {
                return Object.assign({}, previousState, {recentLinks: response.data})
        });
    }

}
