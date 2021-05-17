import express, { response } from 'express'
import {add, read, write} from './jsonFileStorage.js'
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';
// import validate from 'express-validator';
// const { check, validationResult } = validate;

const app = express();
app.set('view engine', 'ejs');
app.use(express.static('public'));
// no need to use any middleware for using favicon. below code works.
app.use('/favicon.ico', express.static('images/ufo.png'));
app.use(express.urlencoded({extended:false}));
app.use(methodOverride('_method'));
app.use(cookieParser());

/*
 * handles '/sighting' route.
*/
function handleSightingGetRoute(req,res){
  // create date obj
  const date = new Date();
  const postingDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;

  res.render('sighting', {
    date:postingDate
  });
}

function handleSightingPostRoute(req,res){
  const newSightingObj = req.body;
  //experiment

  //
  console.log(newSightingObj);
  add('data.json', "sightings",newSightingObj, (err)=>{
    if(err){
      return err;
    }
    res.redirect('/sighting');
  } );
}

function diplaySingleSighting(req,res){
  const sightingIndexNum = req.params.index;
  read('data.json', (err, jsonObj)=>{
    if(err){
      return err;
    }
    const singleSightingObj = jsonObj.sightings[sightingIndexNum];
    console.log('signle sighting');
    console.log( singleSightingObj);
    res.render('sighting-index', {
      singleSightingObj
    });
  });
  
}

function DisplayAllSightings(req,res){
  read('data.json', (err, jsonObj)=>{
    if(err){
      return err;
    }
    const sightingsArr = jsonObj.sightings;
    // cookies
    let visits = 0;
    if(req.cookies.visits){
      visits = Number(req.cookies.visits);
    }
    visits+=1;
    
    res.cookie('visits', visits);
    console.log(`current cookie value, visits: ${visits}`);
    //
    res.render('all-sightings', {
      sightingsArr
    })
  });
}

function editSighting(req, res){
  const sightingIndex= req.params.index;
  read('data.json', (err, jsonObj)=>{
    if(err){
      return err;
    }
    const sightingObj = jsonObj.sightings[sightingIndex];
    res.render('sighting-index-edit', {
    sightingObj,
    sightingIndex:sightingIndex
  });
  });
}

function handleSightingIndexEditPutReq(req,res){
  const sightingIndex = req.params.index;
  read('data.json', (err, jsonObj)=>{
    if(err){
      return err;
    }
    jsonObj.sightings[sightingIndex] = req.body;

    write('data.json', jsonObj, (err)=> {
      if(err){
        return err;
      }
    });
    res.redirect('/');
    
  })
}

function deleteSighting(req,res){
  const sightingIndex = req.params.index;
  read('data.json', (err,jsonObj)=>{
    if(err){
      return err;
    }
    jsonObj.sightings.splice(sightingIndex,1);
    
    write('data.json', jsonObj, (err)=>{
      if(err){
        return err;
      }
    });
  
    res.redirect('/');
  })
}

function renderListOfShapes(req,res){
  read('data.json', (err, jsonObj)=>{
    if(err){
      return err;
    }
    const sightingsArr = jsonObj.sightings;
    const shapesArr =[];
    const shapeIndex =[];
    for(let i=0; i<sightingsArr.length; i+=1){
      let shape = sightingsArr[i].shape;
      if(!shapesArr.includes(shape)){
      shapesArr.push(shape);
      shapeIndex.push(i);
      }
    }

    res.render('shapes', {
      shapes: shapesArr,
      index: shapeIndex
    });
  });
}

function renderShape(req,res){
  const shape = req.params.shape;
  read('data.json',(err, jsonObj)=>{
    if(err){
      return err;
    }
    const sightingsArr = jsonObj.sightings;
    const shapeObjsArr = [];
    const sightingIndex =[];
    for(let i =0; i<sightingsArr.length; i+=1){
      if(sightingsArr[i].shape==shape){
        shapeObjsArr.push(sightingsArr[i]);
        sightingIndex.push(i);
      }
    }
    res.render('shapes-shape', {
      shapeList: shapeObjsArr,
      shape: shape,
      index: sightingIndex
    });
  })
}

function indexPageSort(req,res){
  const sortParam = req.params.q;
  console.log(sortParam);
  const query= req.query.search;
  console.log(req.query.search);

  read('data.json', (err, jsonObj)=>{
    if(err){
      return err;
    }
    const dataArr = jsonObj.sightings;

    if(sortParam==='latest'){
      console.log('hey, latest working');
      const newData = dataArr.sort( (a,b)=>{
        return new Date(b.posting_date)- new Date(a.posting_date);
      });
      res.render('all-sightings', {
        sightingsArr: newData
      })
    }
    else if(sortParam==='duration'){
      const newData = dataArr.sort((a,b)=>{
        return b.duration - a.duration;
      });
      res.render('all-sightings', {
        sightingsArr: newData
      })
    }

    // else if(query==='fireball'){
    else if(query){
      const fireBallArr = [];
      for(let i =0; i<dataArr.length; i+=1){
        if((dataArr[i].shape).toLowerCase() === query.toLowerCase()){
          fireBallArr.push(dataArr[i]);
        }
      }
      console.log(fireBallArr);
      res.render('all-sightings', {
        sightingsArr: fireBallArr
      })
    }
  }); 
}

// get requests
// '/sighting' route. renders a form to create new sightings.
app.get('/sighting', handleSightingGetRoute);

// '/sighting/:index' route. Renders a single sighting of index number provided in the route.
app.get('/sighting/:index', diplaySingleSighting);

// '/' route. Renders a list of sightings.
app.get('/', DisplayAllSightings);

// '/sighting/:index/edit' renders a form to edit sighting
app.get('/sighting/:index/edit', editSighting);

// '/shapes' renders a list of sighting shapes.
app.get('/shapes', renderListOfShapes);

// Render a list of sightings that has the shape.
app.get('/shapes/:shape', renderShape);


// get requests with url query parameter
app.get('/:q?', indexPageSort);

// post requests
// '/sighting' post route to create a new sighting.
app.post('/sighting', handleSightingPostRoute);

// put requests
// '/sighting/:index/edit' route. Accepts a request to edit a single sighting
app.put('/sighting/:index/edit', handleSightingIndexEditPutReq)

// delete requests
// 
app.delete('/sighting/:index', deleteSighting);

app.listen(3004,()=>{
  console.log('server started at port 3004');
});
