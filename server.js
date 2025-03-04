// #region importing modules and setting up express functions

import express from 'express';
import sanitizeHtml from 'sanitize-html';
import fs from 'fs';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

var serverdir = dirname(fileURLToPath(import.meta.url));

var app = express();

app.use(express.static("public"));
var indexdir = "/HTML plan/index.html";
app.use(express.urlencoded());
app.use(express.json());

// #endregion importing modules and setting up express functions

// #region Database containers
var blogtitles = [];
var blogcontents = [];
// #endregion Database containers


// #region pageno article population logic

var selpage=1;
var noofpages;
var ipp=5;

var selpagetitlearr = [];
var selpagecontentarr = [];

function popbloglist(sp) {
    selpagetitlearr = [];
    selpagecontentarr = [];
    
    var sindex = (sp-1)*ipp;
    var neindex = sindex + (ipp -1); 
    if (neindex < blogtitles.length){
        var eindex = neindex;
    } else {
        var eindex = blogtitles.length-1;
    }
    if(blogtitles.length>0) {
        for(let i=sindex; i<=eindex; i++){
            selpagetitlearr.push(blogtitles[i]);
            selpagecontentarr.push(blogcontents[i]);
        }
    }
}

// #endregion pageno article population logic

// region search logic

var searcharr = [];

function search(q){

    
    class Searcharrcons{
        constructor(title, content, index){
            this.title = title;
            this.content = content;
            this.index = index;
        }
    }

    for(let i=0; i<blogtitles.length; i++){
        if((blogtitles[i].toLowerCase().includes(q.toLowerCase()) ) || (blogcontents[i].toLowerCase().includes(q.toLowerCase()) )) {
            let searchresultitem = new Searcharrcons(blogtitles[i], blogcontents[i], i);
            console.log("searchresultitem is: " + searchresultitem);
            searcharr.push(searchresultitem);
        }
    }
}


// #region search results pageno article population logic

var searchselpage=1;
var searchnoofpages;
var searchipp=5;

var searchselpagetitlearr = [];
var searchselpagecontentarr = [];
var searchindexarr = [];

function searchpopbloglist(sp) {
    searchselpagetitlearr = [];
    searchselpagecontentarr = [];
    searchindexarr = [];
    
    var sindex = (sp-1)*searchipp;
    var neindex = sindex + (searchipp -1); 
    if (neindex < searcharr.length){
        var eindex = neindex;
    } else {
        var eindex = searcharr.length-1;
    }
    if(searcharr.length>0) {
        for(let i=sindex; i<=eindex; i++){
            searchselpagetitlearr.push(searcharr[i].title);
            searchselpagecontentarr.push(searcharr[i].content);
            searchindexarr.push(searcharr[i].index);
        }
    }
}

// #endregion search results pageno article population logic


// #region Routing the links from the navigation bar in header
app.get("/", (req, res) => {

    res.render("index.ejs");
    
}
)

app.get("/blogs", (req, res) => {
    
    if(sanitizeHtml(req.query.ipp)){
        ipp = parseInt(sanitizeHtml(req.query.ipp));
        console.log("new ipp received is: "+ ipp);
    } 
    

    if (ipp>0){
        noofpages = Math.ceil(blogtitles.length/ipp);
    } 
   

    if(sanitizeHtml(req.query.selp) && (parseInt(sanitizeHtml(req.query.selp)) <= noofpages) && (parseInt(sanitizeHtml(req.query.selp)) > 0)) {
        var selp = parseInt(sanitizeHtml(req.query.selp));
    } else { var selp = noofpages; }


    popbloglist(selp);
    
    res.render("blogs.ejs", {selpage: selp, noofpages: noofpages, ipp: ipp, selpageblogtitles: selpagetitlearr, selpageblogcontents: selpagecontentarr});
    
}
)
// #endregion Routing the links from the navigation bar in header

// #region blog Creation logic
app.post("/submit", (req, res) => {

    var blogtitle = sanitizeHtml(req.body["blogtitle"]);
    var noofarticles = blogtitles.length + 1
    if(blogtitle === "") {
        var gentitle = "Blog Post # " + noofarticles;
        blogtitles.push(gentitle);
    } else {blogtitles.push(blogtitle);}
    ;

    var blogcontent = sanitizeHtml(req.body["blogcontent"]);
    
    blogcontents.push(blogcontent);
    
    
    
    res.redirect("/blogs");
}
)
// #endregion blog Creation logic

// #region Individual blog edit and delete logic
app.post("/edit", (req, res) => {

    var i = sanitizeHtml(req.body["articleind"]);
    res.render("edit.ejs",{seltitle: blogtitles[i], selcontent: blogcontents[i], artindno: i});
    // console.log("edit was clicked on: " + blogtitles[i] + "with content: " + blogcontents[i]);
    
}
)

app.post("/editsubmit", (req, res) => {
    var editblogtitle = sanitizeHtml(req.body["editblogtitle"]);
    var editblogcontent = sanitizeHtml(req.body["editblogcontent"]);
    var editindex = parseInt(sanitizeHtml(req.body["editorgartindno"]));

    if(editblogtitle === "") {
        var editgentitle = "Blog Post # " + (parseInt(editindex) + 1);
        blogtitles[editindex] = editgentitle;
    } else {blogtitles[editindex] = editblogtitle;}
    ;

    blogcontents[editindex] = editblogcontent;

    var eselp = Math.ceil((editindex+1)/ipp);
    res.redirect("/blogs?selp="+eselp);
})

app.post("/delete", (req, res) => {
    var delindex = sanitizeHtml(req.body["articleind"]);
    console.log("delete was clicked on article index: " + delindex);
    // blogcontents[delindex] = "Deleted Post # " + (parseInt(delindex) + 1);
    blogtitles.splice(delindex,1);
    blogcontents.splice(delindex,1);

    for (let i=0; i<blogtitles.length; i++) {
        if(blogtitles[i].slice(0,12) == "Blog Post # ") {
            blogtitles[i] = "Blog Post # " + ((parseInt(i)+1) );
        }
    }

    // calculate new page number of the cascaded index item and send back to client
    var delrenpage = Math.ceil((parseInt(delindex)+1)/ipp);

    // res.render("blogs.ejs", {blogtitles: blogtitles, blogcontents: blogcontents});
    if (!blogtitles[delindex] && (delindex%ipp === 0 )) {
    res.redirect("/blogs?selp="+(delrenpage-1));
    } else {
        res.redirect("/blogs?selp="+delrenpage);
    }

})
// #endregion Individual blog edit and delete logic

// #region Clicking on a blog heading to display a particular blog


app.get(`/displayblog`, (req, res) =>{
    var i = parseInt(sanitizeHtml(req.query.ind));
    var aselp = Math.ceil((i+1)/ipp);

    res.render("article.ejs", {selp: aselp, selart: blogtitles[i], selcontent: blogcontents[i]});
})
// #endregion Clicking on a blog heading to display a particular blog


app.get('/hoversearch', (req, res) => {
    // var que = req.body["searchquery"];
    var que = sanitizeHtml(req.query.que);
    searcharr = [];
    search(que);
    console.log("the type of searcharr is: " + typeof(searcharr));
    res.json(searcharr);
})


app.get('/search', (req, res) => {

    if(sanitizeHtml(req.query.nque) && (sanitizeHtml(req.query.nque) === "y")){
        searcharr = [];
    }



    if(sanitizeHtml(req.query.sque)){
    var sque = sanitizeHtml(req.query.sque);
    console.log("The value of sque passed is: " + sque);
    search(sque);
    }

    if(req.query.ipp){
        searchipp = parseInt(sanitizeHtml(req.query.ipp));
        console.log("new searchipp received is: "+ searchipp);
    } 
    

    if (searchipp>0){
        searchnoofpages = Math.ceil(searcharr.length/searchipp);
    } 
   

    if(sanitizeHtml(req.query.selp) && (parseInt(sanitizeHtml(req.query.selp)) <= searchnoofpages) && (parseInt(sanitizeHtml(req.query.selp)) > 0)) {
        var searchselp = parseInt(sanitizeHtml(req.query.selp));
    } else { var searchselp = searchnoofpages; }


    searchpopbloglist(searchselp);



    res.render('searchresults.ejs', {selpage: searchselp, noofpages: searchnoofpages, ipp: searchipp, selpageblogtitles: searchselpagetitlearr, selpageblogcontents: searchselpagecontentarr, indexarr: searchindexarr});
    
})

app.listen(3000, console.log("server has started on port 3000"));
