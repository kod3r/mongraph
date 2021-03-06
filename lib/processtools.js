// Generated by CoffeeScript 1.6.2
var Join, ObjectId, constructorNameOf, getCollectionByCollectionName, getModelByCollectionName, getObjectIDAsString, getObjectIDsAsArray, getObjectIdFromString, loadDocumentsFromArray, loadDocumentsFromNodeArray, loadDocumentsFromRelationshipArray, loadDocumentsWithConditions, mongoose, setMongoose, sortOptionsAndCallback, _extractCollectionAndId;

ObjectId = require('bson').ObjectID;

Join = require('join');

mongoose = null;

setMongoose = function(mongooseHandler) {
  return mongoose = mongooseHandler;
};

sortOptionsAndCallback = function(options, cb) {
  if (typeof options === 'function') {
    return {
      options: {},
      cb: options
    };
  } else {
    return {
      options: options || {},
      cb: cb
    };
  }
};

constructorNameOf = function(f) {
  var _ref, _ref1;

  return f != null ? (_ref = f.constructor) != null ? (_ref1 = _ref.toString().match(/function\s+(.+?)\(/)[1]) != null ? _ref1.trim() : void 0 : void 0 : void 0;
};

_extractCollectionAndId = function(s) {
  var parts;

  if ((parts = s.split(":"))) {
    return {
      collectionName: parts[0],
      _id: parts[1]
    };
  }
};

getObjectIDAsString = function(obj) {
  if (typeof obj === 'string') {
    return obj;
  } else if (typeof obj === 'object') {
    return String(obj._id || obj);
  } else {
    return '';
  }
};

getObjectIdFromString = function(s) {
  return new ObjectId(s);
};

getObjectIDsAsArray = function(mixed) {
  var id, ids, item, _i, _len;

  ids = [];
  if ((mixed != null ? mixed.constructor : void 0) === Array) {
    for (_i = 0, _len = mixed.length; _i < _len; _i++) {
      item = mixed[_i];
      if (id = getObjectIDAsString(item)) {
        ids.push(id);
      }
    }
  } else {
    ids = [getObjectIDAsString(mixed)];
  }
  return ids;
};

loadDocumentsWithConditions = function(documents, conditions, options, cb) {
  var allIds, collection, collectionIds, collectionName, condition, doc, id, join, _fn, _i, _len, _ref, _ref1, _ref2;

  _ref = sortOptionsAndCallback(options, cb), options = _ref.options, cb = _ref.cb;
  collectionIds = {};
  allIds = {};
  for (_i = 0, _len = documents.length; _i < _len; _i++) {
    doc = documents[_i];
    collectionName = doc.constructor.collection.name;
    if ((_ref1 = collectionIds[collectionName]) == null) {
      collectionIds[collectionName] = [];
    }
    collectionIds[collectionName].push(doc._id);
    allIds[doc._id] = collectionName;
  }
  if (options.collection && ((_ref2 = collectionIds[options.collection]) != null ? _ref2.length : void 0) > 0) {
    condition = {
      $and: [
        {
          _id: {
            $in: collectionIds[options.collection]
          }
        }, conditions
      ]
    };
    collection = getCollectionByCollectionName(options.collection, mongoose);
    return collection.find(condition, cb);
  }
  join = Join.create();
  _fn = function(collection, id) {
    var callback;

    callback = join.add();
    condition = {
      $and: [
        {
          _id: id
        }, conditions
      ]
    };
    return collection.find(condition, callback);
  };
  for (id in allIds) {
    collectionName = allIds[id];
    collection = getCollectionByCollectionName(collectionName, mongoose);
    _fn(collection, id);
  }
  return join.when(function() {
    var docs, errs, record, result, _j, _k, _len1, _len2, _ref3, _ref4;

    errs = [];
    docs = [];
    for (_j = 0, _len1 = arguments.length; _j < _len1; _j++) {
      result = arguments[_j];
      if (result[0]) {
        errs.push(((_ref3 = result[0]) != null ? _ref3.message : void 0) || result[0]);
      }
      if (result[1]) {
        _ref4 = result[1];
        for (_k = 0, _len2 = _ref4.length; _k < _len2; _k++) {
          record = _ref4[_k];
          docs.push(record);
        }
      }
    }
    if (errs.length > 0) {
      return cb(new Error(errs.join(", ")), docs);
    } else {
      return cb(null, docs);
    }
  });
};

loadDocumentsFromNodeArray = function(result, options, cb) {
  var arrayWithNodes, callbackDocument, i, join, node, _i, _len, _ref, _ref1;

  _ref = sortOptionsAndCallback(options, cb), options = _ref.options, cb = _ref.cb;
  arrayWithNodes = (_ref1 = result[0]) != null ? _ref1.nodes : void 0;
  if (!arrayWithNodes) {
    return cb(new Error("Couldn't find any nodes to process"), result);
  }
  join = Join.create();
  for (i = _i = 0, _len = arrayWithNodes.length; _i < _len; i = ++_i) {
    node = arrayWithNodes[i];
    if (node.id) {
      callbackDocument = join.add();
      node.getDocument(callbackDocument);
    }
  }
  return join.when(function() {
    var data, err, item, _j, _len1;

    err = null;
    data = [];
    for (_j = 0, _len1 = arguments.length; _j < _len1; _j++) {
      item = arguments[_j];
      err = item[0];
      data.push(item[1]);
    }
    if (options.where) {
      return loadDocumentsWithConditions(data, options.where, options, cb);
    } else {
      return cb(err, data, options);
    }
  });
};

loadDocumentsFromArray = function(array, options, cb) {
  var i, join, record, results, specificCollection, _fn, _i, _len, _ref;

  _ref = sortOptionsAndCallback(options, cb), options = _ref.options, cb = _ref.cb;
  specificCollection = null;
  if (options.direction !== 'both' && options.collection) {
    specificCollection = options.collection || null;
  }
  join = Join.create();
  results = [];
  _fn = function(i, record) {
    var callbackFrom, callbackTo, collection, collectionName, condition, doPush, id, relation, _id, _ref1, _ref2;

    if (record.data._to && record.data._from) {
      relation = record;
      doPush = false;
      _ref1 = _extractCollectionAndId(relation.data._to), collectionName = _ref1.collectionName, _id = _ref1._id;
      if (!specificCollection || (specificCollection === collectionName && (options.direction = 'incoming'))) {
        id = getObjectIdFromString(_id);
        condition = options.where && options.direction !== 'incoming' ? {
          $and: [
            {
              _id: id
            }, options.where
          ]
        } : {
          _id: id
        };
        callbackTo = join.add();
        doPush = true;
        collection = getCollectionByCollectionName(collectionName, mongoose);
        collection.findOne(condition, function(err, doc) {
          relation.to = doc;
          return callbackTo(err, relation);
        });
      }
      _ref2 = _extractCollectionAndId(relation.data._from), collectionName = _ref2.collectionName, _id = _ref2._id;
      if (!specificCollection || specificCollection === collectionName && (options.direction = 'outgoing')) {
        id = getObjectIdFromString(_id);
        condition = options.where && options.direction !== 'outgoing' ? {
          $and: [
            {
              _id: id
            }, options.where
          ]
        } : {
          _id: id
        };
        callbackFrom = join.add();
        doPush = true;
        collection = getCollectionByCollectionName(collectionName, mongoose);
        collection.findOne(condition, function(err, doc) {
          relation.from = doc;
          return callbackFrom(err, relation);
        });
      }
      if (doPush) {
        return results.push(relation);
      }
    } else {
      return cb(new Error('We have no relationship here'), null);
    }
  };
  for (i = _i = 0, _len = array.length; _i < _len; i = ++_i) {
    record = array[i];
    _fn(i, record);
  }
  return join.when(function() {
    var finalResults, result, _j, _len1;

    if (options.where) {
      finalResults = [];
      for (_j = 0, _len1 = results.length; _j < _len1; _j++) {
        result = results[_j];
        if (result.from && result.to) {
          finalResults.push(result);
        }
      }
    } else {
      finalResults = results;
    }
    return cb(null, finalResults, options);
  });
};

loadDocumentsFromRelationshipArray = function(graphResultset, options, cb) {
  var i, relation, relations, _i, _len, _ref;

  _ref = sortOptionsAndCallback(options, cb), options = _ref.options, cb = _ref.cb;
  if (!((graphResultset != null ? graphResultset.constructor : void 0) === Array || (graphResultset = getObjectIDsAsArray(graphResultset)).constructor === Array)) {
    return cb(new Error('No Array given'), null, options);
  }
  relations = [];
  for (i = _i = 0, _len = graphResultset.length; _i < _len; i = ++_i) {
    relation = graphResultset[i];
    if (constructorNameOf(relation) === 'Relationship') {
      relations.push(relation);
    }
  }
  if (options.countRelationships) {
    return cb(null, relations.length, options);
  }
  if (!(relations.length > 0)) {
    return cb(null, null, options);
  }
  options.graphResultset = graphResultset;
  return loadDocumentsFromArray(relations, options, cb);
};

getModelByCollectionName = function(collectionName, mongoose) {
  var i, models, name, nameOfModel;

  if (constructorNameOf(mongoose) === 'Mongoose') {
    models = mongoose.models;
  } else if (!mongoose) {
    return null;
  } else {
    models = mongoose;
  }
  name = null;
  for (nameOfModel in models) {
    i = models[nameOfModel];
    if (collectionName === models[nameOfModel].collection.name) {
      name = models[nameOfModel].modelName;
    }
  }
  return name;
};

getCollectionByCollectionName = function(collectionName, mongoose) {
  var modelName, _ref;

  modelName = getModelByCollectionName(collectionName, mongoose);
  return mongoose.models[modelName] || ((_ref = mongoose.connections[0]) != null ? _ref.collection(collectionName) : void 0) || mongoose.collection(collectionName);
};

module.exports = {
  getObjectIDAsString: getObjectIDAsString,
  getObjectIDsAsArray: getObjectIDsAsArray,
  loadDocumentsFromRelationshipArray: loadDocumentsFromRelationshipArray,
  loadDocumentsFromNodeArray: loadDocumentsFromNodeArray,
  constructorNameOf: constructorNameOf,
  getObjectIdFromString: getObjectIdFromString,
  sortOptionsAndCallback: sortOptionsAndCallback,
  getModelByCollectionName: getModelByCollectionName,
  getCollectionByCollectionName: getCollectionByCollectionName,
  setMongoose: setMongoose
};
