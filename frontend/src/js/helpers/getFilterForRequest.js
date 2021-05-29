export const getFilterForRequest = filterObject => {
    let filterForRequest = {};
    Object.keys(filterObject).forEach(prop => {
        if (prop !== "age" && filterObject[prop] !== "")
            filterForRequest = {...filterForRequest, [prop]: filterObject[prop]};
        else if (prop === "age" && (filterObject.age[0] > 5 || filterObject.age[1] < 100))
            filterForRequest = {...filterForRequest, age: filterObject.age};
    });
    return filterForRequest;
};
