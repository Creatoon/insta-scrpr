## Instagram video content details generator

### Setup

```js
  $ npm install
  $ npm start

```

### More Info

1. There is a handles.csv file that contains instagram handles
2. Once you hit command `npm start`, then a json file will be generated containing data about each handle
3. Each handle in the generated json file will have the data according to the below data structure

```js
{
  handle: {
    totalVideos,
      maxLikes,
      averageLikes,
      maxComment,
      averageComments,
      maxViewCount;
  }
}
```
