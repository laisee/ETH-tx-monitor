console.log("Test is "+process.env.test);

let arr = process.env.test.split(',');
console.log(arr);
for (var address of arr) {
  console.log("Item is "+address);
}
