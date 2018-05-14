export const resetState = () => {
    return {
        type: 'RESET_STATE'
    }
};

export const updateState = (state) => {
    return {
        type: 'UPDATE_STATE',
        data: state
    }
}