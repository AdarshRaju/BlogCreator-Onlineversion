console.log("tested");

var regex = /<[^>]+>/g;

var a = "<p><p>2</p></p>"

a.replace(regex, "");
console.log(a.replace(regex, ""));
