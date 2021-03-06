var mongoose = require('mongoose');
var Group = require('../models/GroupModel');
var User = require('../../authorization/models/UserModel');
var ObjectId = mongoose.Types.ObjectId;
var getSlug = require('speakingurl');
var GroupUrl = require('../models/GroupUrlModel');
var BlogUrl = require('../../blog/models/BlogUrlModel');
var winston = require('winston');

exports.create = function(req,res){
    var group = new Group();
    group.description = req.body.description;
    group.name = req.body.name;
    group.group_type = req.body.group_type;
    group.created_by = new ObjectId(req.user._id);
   /* if(req.body.members){
        for (i = 0; i < req.body.members.length; i++) { 
            group.members.push(new ObjectId(req.body.members[i]));
        }
    }*/
    generateUrl(slug(group.name),function(url){
        group.url = url;
        group.save(function(err,result){
            if(err){
                res.json({'type':false,'msg':'Problem occurred while creating Group'});
            }
            console.log("  create : "+JSON.stringify(result));
            var data = result.toObject();
            data.type = true;
            winston.log(" Group created : "+JSON.stringify(data));
            res.json(data);
        });
    });
};

exports.getById = function(req,res){
    var id = req.params.id;
    id = new ObjectId(id);
    Group.findById(id,function(err,result){
        if(err){
            res.send(err);
        }
        var data = result.toObject();
        data.type = true;
        res.json(data);
    });
};

exports.getByUrl = function(req,res){
   Group.findOne({url:req.params.url},function(err,result){
       if(err){
           res.send(err);
       }
       var data = result.toObject();
       data.type = true;
       res.json(data);
   });
};

exports.getAllByCreator = function(req,res){
    var createdby_id = new ObjectId(req.params.createdby_id);
    Group.find({'created_by':createdby_id},function(err,result){
        if(err){
            res.send(err);
        }
        res.json(result);
    });
};


exports.getAllByCallingUser = function(req,res){
    Group.find({'created_by': new ObjectId(req.user._id)}).sort({'last_updated_at':-1}).exec(function(err,result){
        if(err){
            res.send(err);
        }
        res.json(result);
    });
};



exports.update = function(req,res){
    var id = new ObjectId(req.params.id);
    Group.findById(id,function(err,group){
        if(err){
            res.send(err);
        }
        group.description = req.body.description;
        group.name = req.body.name;
        group.group_type = req.body.group_type;
        console.log(" ### type found in update : "+req.body.type);
        group.created_by = new ObjectId(req.user._id);
      /*  if(req.body.members){
            for (i = 0; i < req.body.members.length; i++) { 
                group.members.push(new ObjectId(req.body.members[i]));
            }
        }*/
        generateUrl(slug( group.name),function(url){
            group.url = url;
            group.save(function(err,result){
                if(err){
                    res.json({'type':false,'msg':'Problem occurred while updating Group'});
                }
                var data = result.toObject();
                data.type = true;
                winston.log(" Group created : "+JSON.stringify(data));
                res.json(data);
            });
        }); 
    });
};

exports.delete = function(req,res){
    var id = req.params.id;
    try{
        id = new ObjectId(id);
        Group.remove({_id : id},function(err,result){
            if(err){
                res.send(err);
            }
            res.json(result);
        });
    }catch(e){
        res.send(404);
    }
};



var slug = function(name){
    return getSlug(name);
}

var formatURL = function(cnt,url){
    var len = cnt.toString().length;
    if(cnt == 0)
        return url;
    if(len == 1){
        return  url.substring(0,url.length - cnt.toString().length + 2) + cnt;
    }else
        return url.substring(0,(url.length) - (cnt.toString().length - 1)) + cnt;
};

var generateUrl = function(url,callback){
    var blogUrl = new BlogUrl();
    var urlFound;
    var count=0;
    (function loop() {
        checkUrl(url,function(result){
            if(Number(result) > 0){
                count++;
                url = formatURL(count,url);
                loop();
            }else{
                blogUrl.url = url;
                blogUrl.save(function(err,result){
                    //console.log(" new Blog URL Created : "+JSON.stringify(result));
                });
                callback(url);
            }
        })
    }());
}

var checkUrl = function(url,callback){
    return GroupUrl.count({'url':url},function(err, count){
        callback(count);
    });
}