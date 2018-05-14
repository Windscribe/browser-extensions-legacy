import Immutable from 'immutable';

const initialState = Immutable.Map({});
export default function pacFile(state = initialState, action) {
    let PAC;
    switch (action.type) {
        case "CHANGE_PAC_LOCATION":
            // action.data.locations and action.data.selectedLocation must be Immutable data structures
            PAC = atob(state.get("pac"));

            // below rewriting checkDefaultLocation() function
            const defaultLocation = PAC.match("defaultLocation = '(.*?)';")[1] || 'GB';
            let locationData = action.data.locations.find( (location) => location.get('short_name') === defaultLocation);

            if ( ( locationData.get('premium_only') === 1 &&
                !action.data.isPremium ) ||
                locationData.get('status') === 2) {
                locationData = action.data.locations.find( (location) => location.get('premium_only') !== 1 && location.get('status') !== 2 )
            }

            const newLocation = action.data.selectedLocation.get('short_name') || locationData.get('short_name');
            let regEx;
            let hostname = '';

            PAC = PAC.replace(/(.*chosenLocation = )(.*?)(;.*)/mg, '$1\'' + newLocation + '\'$3');
            if(action.data.selectedLocation.get('short_name') === "CR") {
                PAC = PAC.replace(/(.*controlMode = )(.*?)(;.*)/mg, '$1\'' + 'cr' + '\'$3');
                regEx = new RegExp(`${defaultLocation}['"]:\\\s?["']HTTPS\\\s([\\\w\\\d\\\-\\\._]*):`, `m`);
                hostname = PAC.match(regEx);
            } else {
                PAC = PAC.replace(/(.*controlMode = )(.*?)(;.*)/mg, '$1\'' + 'manual' + '\'$3');
                regEx = new RegExp(`${newLocation}['"]:\\\s?["']HTTPS\\\s([\\\w\\\d\\\-\\\._]*):`, `m`);
                hostname = PAC.match(regEx);
            }
            // console.log('paccccc', regEx, hostname, PAC);
            
            return state.set("pac", btoa(PAC))
                .set("hostname", hostname && hostname[1]);
        case "SET_PAC":
            return state.set("pac", btoa(action.data));
        case 'UPDATE_STATE':
            return Immutable.fromJS(action.data);
        default:
            return state;
    }
}
