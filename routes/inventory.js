var User      = require('./../modules/user.js'),
    db        = require('./../modules/db.js');
    
var mongo     = require('mongojs'),
    cache     = require('memory-cache'),
    _         = require('underscore');

module.exports = {
    all: function(req, res) {
        res.json(cache.get('allInventory'));
    },
    existing: function(req, res) {
        
        //console.log("Req for inventory of Event ID " + req.params.id);
        //Event filtering and inventory
        /*var selectedEvent = events.filter(function(event) {
            return event.id == req.params.id;
        })[0];*/
        db.events.findOne({_id: mongo.ObjectId(req.params.id)}, function(err, event) {
            if (err || !event) {
                console.log(req.url);
                console.log("No events found: " + err);
            } else {
                var inv = event.inventory.map(function (item) {
                    var thing = _.findWhere(cache.get('allInventory'), {id: parseInt(item.item)});
                    thing.amt = item.amt;
                    return thing;
                });
                res.json(inv);
            }
        });
    },
    add: function(req, res) {
        if(User.permission(req) < 1) {
            res.json(false);
            return false;
        }
        //console.log("Req for adding inventory ID " + req.body.inventoryid + " to Event ID " + req.body.eventid);
        //frontend checks for the same inventory adding, so no control needed for that
         //try to find the thing by its id and use the same data
        var selected = _.findWhere(cache.get('allInventory'), {id: parseInt(req.body.inventoryid)});
        if(_.isUndefined(selected)) {
            console.log("Such an inventory item doesn't exist");
            return false;
        }

        db.events.update(
            {_id: mongo.ObjectId(req.body.eventid)},
            { $addToSet: {'inventory': {item: req.body.inventoryid, amt: 1} } }, 
            function(err, updated) {
                if (err || !updated) {
                    console.log(req.url);
                    console.log("Inventory not added:" + err);
                } else {
                    //console.log("Inventory added");
                    res.json(true);
                }
            });
    },
    remove: function(req, res) {
        if(User.permission(req) < 1) {
            res.json(false);
            return false;
        }
        //console.log("Req for removing inventory ID " + req.body.inventoryid + " from Event ID " + req.body.eventid);
        db.events.update(
            {_id: mongo.ObjectId(req.body.eventid)},
            { $pull: {'inventory': {item: req.body.inventoryid} } }, 
            function(err, updated) {
                if (err || !updated) {
                    console.log(req.url);
                    console.log("Inventory not removed:" + err);
                } else {
                    //console.log("Inventory removed");
                    res.json(true);
                }
            });
    },
    update: function (req, res) {
        if(User.permission(req) < 1) {
            res.json(false);
            return false;
        }
        //console.log("Req for updating inventory ID " + req.body.inventoryid + " from Event ID " + req.body.eventid);
        db.events.update(
            {_id: mongo.ObjectId(req.body.eventid), 'inventory.item': req.body.inventoryid},
            { $set: {'inventory.$.amt': req.body.amount} }, 
            function(err, updated) {
                if (err || !updated) {
                    console.log(req.url);
                    console.log("Inventory not updated:" + err);
                } else {
                    //console.log("Inventory updated");
                    res.json(true);
                }
            });
    }
};
