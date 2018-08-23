//////////////////////////////////// ActionDescriptor //////////////////////////////////////

ActionDescriptor.prototype.getFlatType = function (ID) {
    return getFlatType(this, ID);
};

ActionList.prototype.getFlatType = function (index) {
    // Share the ActionDesciptor code via duck typing
    return getFlatType(this, index);
};

// Traverse the object described the string in the current layer.
// Objects take the form of the nested descriptor IDs (the code above figures out the types on the fly).
// So
//     AGMStrokeStyleInfo.strokeStyleContent.'Clr '.'Rd  '
// translates to doing a eventGet of stringIDToTypeID("AGMStrokeStyleInfo") on the current layer,
// then doing:
//   desc.getObject(s2ID("AGMStrokeStyleInfo"))
//		.getObject(s2ID("strokeStyleContent)).getObject(c2ID('Clr ')).getDouble('Rd  ');
//
ActionDescriptor.prototype.getVal = function (keyList, firstListItemOnly) {
    if (typeof(keyList) == 'string')	// Make keyList an array if not already
        keyList = keyList.split('.');

    if (typeof(firstListItemOnly) == 'undefined')
        firstListItemOnly = true;

    // If there are no more keys to traverse, just return this object.
    if (keyList.length == 0)
        return this;

    keyStr = keyList.shift();
    keyID = makeID(keyStr);

    if (this.hasKey(keyID))
        switch (this.getType(keyID)) {
            case DescValueType.OBJECTTYPE:
                return this.getObjectValue(keyID).getVal(keyList, firstListItemOnly);
            case DescValueType.LISTTYPE:
                // THIS IS CREEPY - original code below fails in random places on the same document.
                return /*this.getList( keyID )*/this.getList(keyID).getVal(keyList, firstListItemOnly);
            default:
                return this.getFlatType(keyID);
        }
    else
        return null;
};

// Traverse the actionList using the keyList (see below)
ActionList.prototype.getVal = function (keyList, firstListItemOnly) {
    if (typeof(keyList) == 'string')	// Make keyList an array if not already
        keyList = keyList.split('.');

    if (typeof(firstListItemOnly) == 'undefined')
        firstListItemOnly = true;

    // Instead of ID, pass list item #.  Duck typing.
    if (firstListItemOnly)
        switch (this.getType(0)) {
            case DescValueType.OBJECTTYPE:
                return this.getObjectValue(0).getVal(keyList, firstListItemOnly);
            case DescValueType.LISTTYPE:
                return this.getList(0).getVal(keyList, firstListItemOnly);
            default:
                return this.getFlatType(0);
        }
    else {
        var i, result = [];
        for (i = 0; i < this.count; ++i)
            switch (this.getType(i)) {
                case DescValueType.OBJECTTYPE:
                    result.push(this.getObjectValue(i).getVal(keyList, firstListItemOnly));
                    break;
                case DescValueType.LISTTYPE:
                    result.push(this.getList(i).getVal(keyList, firstListItemOnly));
                    break;
                default:
                    result.push(this.getFlatType(i));
            }
        return result;
    }
};

ActionDescriptor.prototype.extractBounds = function () {
    function getbnd(desc, key) {
        return makeUnitVal(desc.getVal(key));
    }

    return [getbnd(this, 'left'), getbnd(this, 'top'), getbnd(this, 'right'), getbnd(this, 'bottom')];
};

ActionDescriptor.dumpValue = function (flatValue) {
    if ((typeof flatValue == 'object') && (typeof flatValue.refclass == 'string'))
        return '{ ' + flatValue.refclass + ': ' + flatValue.value + ' }';
    else
        return flatValue;
};

function echoSpace(num) {
    var str = '';
    for (var i = 0; i < num; i += 1) {
        str += ' ';
    }
    return str;
}

ActionDescriptor.prototype.dumpAllKey = function (indent) {
    var obj = {};

    for (var i = 0; i < this.count; i += 1) {
        console.log(echoSpace(indent) + 'current: ', i + '/' + this.count);
        try {
            console.log(this, this instanceof ActionDescriptor);
            var typeID = this.getKey(i);
            console.log(echoSpace(indent) + 'typeID', typeID);
            var key = app.typeIDToStringID(typeID);
            var childDesc = this.getVal(key);
            console.log(echoSpace(indent) + key + ':', childDesc);
            if (childDesc instanceof ActionDescriptor) {
                obj[key] = childDesc.dumpAllKey(indent + 8);
            } else {
                obj[key] = childDesc;
            }
        } catch (e) {
            console.error(e, obj);
        }
    }
    return obj;
};

// Debugging - recursively walk a descriptor and dump out all of the keys
// Note we only dump stringIDs.  If you look in UActions.cpp:CInitialStringToIDEntry,
// there is a table converting most (all?) charIDs into stringIDs.
ActionDescriptor.prototype.dumpDesc = function (keyName) {
    var i;
    if (typeof(keyName) == 'undefined')
        keyName = '';

    for (i = 0; i < this.count; ++i) {
        console.log('current: ', i + '/' + this.count);
        var key = this.getKey(i);
        var ref;
        var thisKey = keyName + '.' + app.typeIDToStringID(key);
        switch (this.getType(key)) {
            case DescValueType.OBJECTTYPE:
                this.getObjectValue(key).dumpDesc(thisKey);
                break;
            case DescValueType.LISTTYPE:
                this.getList(key).dumpDesc(thisKey);
                break;
            case DescValueType.REFERENCETYPE:
                ref = this.getFlatType(key);
                console.log(thisKey + ':ref:' + ref.refclass + ':' + ref.value);
                break;
            default:
                console.log(thisKey + ': ' + ActionDescriptor.dumpValue(this.getFlatType(key)));
        }
    }
};

ActionList.prototype.dumpDesc = function (keyName) {
    var i;
    if (typeof(keyName) == 'undefined')
        keyName = '';

    if (this.count == 0)
        console.log(keyName + ' <empty list>');
    else
        for (i = 0; i < this.count; ++i) {
            try {
                if (this.getType(i) == DescValueType.OBJECTTYPE)
                    this.getObjectValue(i).dumpDesc(keyName + '[' + i + ']');
                else if (this.getType(i) == DescValueType.LISTTYPE)
                    this.getList(i).dumpDesc(keyName + '[' + i + ']');
                else
                    console.log(keyName + '[' + i + ']:'
                        + ActionDescriptor.dumpValue(this.getFlatType(i)));
            }
            catch (err) {
                console.log('Error ' + keyName + '[' + i + ']: ' + err.message);
            }
        }
};
