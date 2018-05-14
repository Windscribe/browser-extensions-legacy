export const changePACLocation = (data) => {
    return {
        type: 'CHANGE_PAC_LOCATION',
        data
    }
};

export const setPac = (pac) => {
    return {
        type: 'SET_PAC',
        data : pac
    }
}