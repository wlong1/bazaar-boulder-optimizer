let _uidCounter = 1;
const board = [];

export const boardManager = {
    addClone(baseItem, { maxSpace = 20 } = {}) {
        if (board.length + 1 > maxSpace) return null;
        const instance = baseItem.clone();
        instance._uid = `inst_${_uidCounter++}`; 
        board.push(instance);
        return instance;
    },

    getByUid(uid) {
        return board.find(i => i._uid === uid) || null;
    },

    removeByUid(uid) {
        const idx = board.findIndex(i => i._uid === uid);
        if (idx === -1) return false;
        board.splice(idx, 1);
        return true;
    },

    removeAt(index) {
        if (index < 0 || index >= board.length) return false;
        board.splice(index, 1);
        return true;
    },

    getAll() { return board.slice(); },
    getCount() { return board.length; }
};