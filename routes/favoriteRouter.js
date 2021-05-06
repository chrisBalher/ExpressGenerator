const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const authenticate = require('../authenticate');
const Favorites = require('../models/favorites');
const cors = require('./cors');
const favoriteRouter = express.Router();

favoriteRouter.use(bodyParser.json());

/* ROUTE GROUP */
favoriteRouter.route('/')
.options(cors.corsWithOptions, (req, res)=>{ res.sendStatus.sendStatus(200); })
.get(cors.cors,  (req, res, next)=>{
    Favorites.find({})
    .populate('user')
    .populate('dishes')
    .then( (favorites)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favorites);
    }, (err)=> next(err))
    .catch((err)=>next(err));
})

.post( cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Favorites.find({})
    .then( (favorites)=>{
        if(favorites.length > 0 ){
            
            favorites.forEach( (favorite)=>{
                if( favorite.user._id.equals(req.user._id) ){
                    

                    for( i=0;i<req.body.length;i++ ){
                        if ( favorite.dishes.indexOf(req.body[i]._id) >= 0 ) {
                            err = new Error('Favorite dish' + req.body[i]._id + ' already added');
                            err.status = 403;
                            return next(err);
                        }else{
                            favorite.dishes.push(req.body[i]._id);
                        }   
                    }
                    favorite.save()
                    .then((favorite)=>{
                        console.log('favorite Added ', favorite);
                        res.statusCode = 200;
                        res.setHeader('Content-Type','application/json');
                        res.json(favorite);
                    }, (err) => next(err));
                }
                else{
                    err = new Error('You are not allowed to make this change');
                    err.status = 500;
                    return next(err);
                }
            });

        }else if (favorites.length <= 0){
 
            Favorites.create(req)
            .then( (favorite)=>{
                
                for( i=0;i<req.body.length;i++ ){
                    favorite.dishes.push(req.body[i]._id);
                }
                favorite.user = req.user._id;
                favorite.save()
                console.log('favorite Created ', favorite);
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(favorite);
            },(err)=>next(err))
            .catch( (err)=>next(err) );
        }else{
            err = new Error('Favorite '+ req.params.favoriteId + ' not found or not defined.');
            err.status = 404;
            return next(err);
        }
    }, (err)=>next(err) )
    .catch( (err)=>next(err) );
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    res.statusCode = 403;
    res.end("PUT operation not supported on /Favorites");
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Favorites.find({})
    .then( (favorites)=>{
        if(favorites.length > 0 ){
            
            favorites.forEach( (favorite)=>{
                if( favorite.user._id.equals(req.user._id) ){
                    favorite.delete()
                    .then((fav)=>{
                        console.log('favorite Deleted ', fav);
                        res.statusCode = 200;
                        res.setHeader('Content-Type','application/json');
                        res.json(fav);
                    }, (err) => next(err));
                }
            });
        }else{
            err = new Error('Favorite  not found .');
            err.status = 404;
            return next(err);
        }
    }, (err)=>next(err)) 
    });


/* ROUTE GROUP */
favoriteRouter.route('/:favoriteId')
.options(cors.corsWithOptions, (req, res)=>{ res.sendStatus.sendStatus(200); })
.get(cors.cors, (req, res, next)=>{
    Favorites.findById(req.params.favoriteId)
    
    .then((favorite)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(favorite);
    },(err)=>next(err))
    .catch((err)=>next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next) => {
    
    Favorites.find({})
    .then( (favorites)=>{
        if(favorites.length > 0 && req.params.favoriteId.length > 0 ){
            
            favorites.forEach( (favorite)=>{
                if( favorite.user._id.equals(req.user._id) ){
                    if ( favorite.dishes.indexOf(req.params.favoriteId) >= 0 ) {
                        err = new Error('Favorite dish' + req.params.favoriteId + ' already added');
                        err.status = 403;
                        return next(err);
                    }else{
                        favorite.dishes.push(req.params.favoriteId);
                        favorite.save()
                        .then((favorite)=>{
                            console.log('favorite Added ', favorite);
                            res.statusCode = 200;
                            res.setHeader('Content-Type','application/json');
                            res.json(favorite);
                        }, (err) => next(err));
                    }
                }
                else {
                    err = new Error('You are not allowed to make this change');
                    err.status = 500;
                    return next(err);
                }
            });

        }else if (favorites.length <= 0){
            req.body.user = req.user._id;
            Favorites.create(req.body)
            .then( (fav)=>{
                fav.dishes.push(req.params.favoriteId);
                fav.save()
                console.log('favorite Created ', fav);
                res.statusCode = 200;
                res.setHeader('Content-Type','application/json');
                res.json(fav);
            },(err)=>next(err))
            .catch( (err)=>next(err) );
        }else{
            err = new Error('Favorite '+ req.params.favoriteId + ' not found or not defined.');
            err.status = 404;
            return next(err);
        }
    }, (err)=>next(err) )
    .catch( (err)=>next(err) );

    
})
.put(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    Favorites.findByIdAndUpdate(req.params.favoriteId, {
        $set: req.body
    }, {new: true})
    .then((favorite)=>{
        res.statusCode = 200;
        res.setHeader('Content-Type','application/json');
        res.json(favorite);
    },(err)=>next(err))
    .catch((err)=>next(err)); 
})
.delete(cors.corsWithOptions, authenticate.verifyUser, authenticate.verifyAdmin, (req, res, next)=>{
    function arrayRemove(arr, value) { 
    
        return arr.filter(function(ele){ 
            return ele != value; 
        });
    }
    
    Favorites.find({})
    .then( (favorites)=>{
        if(favorites.length > 0 ){
            let favo
            favorites.forEach( (favorite)=>{
                if( favorite.user._id.equals(req.user._id) ){
                    if( favorite.dishes.indexOf(req.params.favoriteId)>=0 ){
                        favorite.dishes = arrayRemove(favorite.dishes, req.params.favoriteId);
                    }
                    favorite.save()
                    .then((favorite)=>{
                        console.log('favorite Deleted ', req.params.favoriteId);
                        res.statusCode = 200;
                        res.setHeader('Content-Type','application/json');
                        res.json(favorite);
                    }, (err) => next(err));
                }
            });
        }else{
            err = new Error('Favorite  not found .');
            err.status = 404;
            return next(err);
        }
    }, (err)=>next(err)) 

});

module.exports = favoriteRouter;