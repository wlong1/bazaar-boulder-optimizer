import { effType, Effect, Item, Listener, targetType, tagType, itemType, modType } from "./item.js";

function enumLookup(enumObj, key) {
    if (key === undefined || key === null) return undefined;

    if (typeof key === 'number') return key;

    if (typeof key === 'string') {
        if (key in enumObj) return enumObj[key];
        const foundKey = Object.keys(enumObj).find(k => k.toLowerCase() === key.toLowerCase());
        if (foundKey) return enumObj[foundKey];
    }

    throw new Error(`Enum lookup failed: key "${key}" not found in enum.`);
}

function buildAmount(amountSpec) {
    if (!amountSpec) return () => 0;

    if (typeof amountSpec === 'number') return () => amountSpec;

    if (amountSpec.kind === 'context') {
        const key = amountSpec.key;
        return (context) => context?.[key];
    }

    return () => 0;
}

function checkTypeTags(items, tag){
    return items.some(item => item.getTypeTags().has(tag));
}

function checkItemTags(items, tag){
    return items.some(item => item.getItemTags().has(tag));
}

function countUniqueTags(items){
    const allTags = items.flatMap(item => [...item.getTypeTags()]);
    return new Set(allTags).size;
}

function makeCondition(desc) {
    if (!desc) return () => true;

    if (Array.isArray(desc)) {
        const subs = desc.map(makeCondition);
        return (context, effect, items, source) => subs.every(fn => fn(context, effect, items, source));
    }

    const kind = desc.kind;

    if (kind === 'and') {
        const subs = (desc.clauses || []).map(makeCondition);
        return (context, effect, items, source) => subs.every(fn => fn(context, effect, items, source));
    }

    if (kind === 'or') {
        const subs = (desc.clauses || []).map(makeCondition);
        return (context, effect, items, source) => subs.some(fn => fn(context, effect, items, source));
    }

    switch (kind) {
        case 'always':
            return () => true;

        case 'anyHasTypeTag':
            return (context, effect, items, source) => {
                const t = enumLookup(tagType, desc.tag);
                return checkTypeTags(items, t, source);
            };

        case 'anyHasItemType':
            return (context, effect, items, source) => {
                const it = enumLookup(itemType, desc.itemType);
                return checkItemTags(items, it, source);
            };

        case 'countUniqueTagsAtLeast':
            return (context, effect, items, source) => countUniqueTags(items) >= (desc.min || 0);

        case 'otherHasTag':
            return (context, effect, items, source) => {
                const idx = Number(source) + (desc.offset || 0);
                const neighbor = items[idx];
                if (!neighbor || !neighbor.getTypeTags) return false;
                return neighbor.getTypeTags().has(enumLookup(tagType, desc.tag));
            };

        case 'isItemId':
            return (context, effect, items, source) => {
                const item = items[source];
                return item && item.getId && item.getId() === desc.id;
            };

        default:
            console.warn('Unknown condition kind:', kind);
            return () => false;
    }
}


function makeEffectFunc(effectDesc) {
    if (!effectDesc) return () => {};
    switch (effectDesc.kind) {
        case 'addTimeModSelf':
            return (context, effect, items, source) => {
                const item = items[source];
                if (!item) return null;
                const mt = enumLookup(modType, effectDesc.modType);
                item.addTimeMod(mt, effectDesc.value);
                return null;
            };

        case 'addTimeModOther':
            return (context, effect, items, source) => {
                const baseIndex = (typeof source === 'number') ? source : 0;
                const mt = enumLookup(modType, effectDesc.modType);
                for (const offset of effectDesc.offsets || []) {
                    const neighbor = items[baseIndex + offset];
                    if (!neighbor) continue;
                    neighbor.addTimeMod(mt, effectDesc.value);
                }
                return null;
            };

        case 'setMultiFromAmmo':
            return (context, effect, items, source) => {
                const item = items[source];
                if (!item) return null;
                const ammo = (item.getAmmo && item.getAmmo()) || 0;
                if (item.setMulti) item.setMulti(1 + ammo);
                return null;
            };

        default:
            return () => {};
    }
}

function parseEffectDescriptor(desc) {
    const eType = enumLookup(effType, desc.type);
    const target = desc.target ? enumLookup(targetType, desc.target) : undefined;
    const amountFunc = buildAmount(desc.amount);
    return new Effect({ type: eType, amount: amountFunc, target });
}

function parseListenerDescriptor(desc) {
    const condition = makeCondition(desc.condition);
    const effectFn = makeEffectFunc(desc.effect);
    return new Listener({ condition, effect: effectFn });
}

export function loadItems(itemsData) {
    const created = [];

    for (const baseItem of itemsData) {
        const baseEffects = (baseItem.baseEffects || []).map(parseEffectDescriptor);

        const itemTags = new Set((baseItem.itemTags || []).map(t => enumLookup(itemType, t)));
        const typeTags = new Set((baseItem.typeTags || []).map(t => enumLookup(tagType, t)));

        const staticListeners = (baseItem.staticListeners || []).map(parseListenerDescriptor);
        const dynListeners = (baseItem.dynListeners || []).map(parseListenerDescriptor);


        const item = new Item({
            id: baseItem.id ?? null,
            name: baseItem.name ?? '',
            usable: baseItem.usable ?? true,
            symmetric: baseItem.symmetric ?? true,
            cooldown: baseItem.cooldown ?? 0,
            clock: baseItem.clock ?? 0,
            baseEffects,
            itemTags,
            typeTags,
            staticListeners,
            dynListeners,
            size: baseItem.size ?? 1,
            random: baseItem.random ?? 0,
            multi: baseItem.multi ?? 1,
            ammo: baseItem.ammo ?? -1
        });

        created.push(item);
    }

    return created;
}
